"""arq worker tasks."""

from datetime import datetime, timezone
from typing import Any

from arq import create_pool
from arq.connections import ArqRedis, RedisSettings
from sqlalchemy import select, delete

from src.config import get_settings
from src.db import get_session
from src.db.models import DriveAccount, DriveChannel, File, Chunk
from src.services.chunking import ChunkingService
from src.services.drive import DriveAuthService, DriveSyncService, DriveExportService, DriveWatchService
from src.services.embeddings import get_embedding_service
from src.services.extraction import extract_content
from src.utils.logging import get_logger

logger = get_logger(__name__)

# Global pool reference
_arq_pool: ArqRedis | None = None


async def get_arq_pool() -> ArqRedis:
    """Get or create arq connection pool."""
    global _arq_pool
    if _arq_pool is None:
        settings = get_settings()
        # Parse redis URL
        url = settings.redis_url
        if url.startswith("redis://"):
            url = url[8:]
        parts = url.split("/")
        host_port = parts[0]
        database = int(parts[1]) if len(parts) > 1 else 0

        if ":" in host_port:
            host, port = host_port.split(":")
            port = int(port)
        else:
            host = host_port
            port = 6379

        _arq_pool = await create_pool(
            RedisSettings(host=host, port=port, database=database)
        )
    return _arq_pool


async def sync_changes(ctx: dict[str, Any], account_id: str) -> dict[str, Any]:
    """
    Process Google Drive changes for an account.

    Called when webhook notifies of changes.
    """
    async with get_session() as session:
        sync_service = DriveSyncService(session)

        try:
            changes = await sync_service.sync_changes(account_id)

            # Enqueue jobs for each change
            pool = await get_arq_pool()
            for change in changes:
                if change["action"] == "delete":
                    await pool.enqueue_job("delete_file", change["file_id"])
                elif change["action"] == "reindex":
                    await pool.enqueue_job("reindex_file", account_id, change["file_id"])

            logger.info(
                "Processed changes",
                account_id=account_id,
                count=len(changes),
            )

            return {"processed": len(changes)}

        except Exception as e:
            logger.error("Sync failed", account_id=account_id, error=str(e))
            raise


async def reindex_file(ctx: dict[str, Any], account_id: str, drive_file_id: str) -> dict[str, Any]:
    """
    Download, extract, chunk, embed, and store a file.
    """
    async with get_session() as session:
        auth_service = DriveAuthService(session)
        export_service = DriveExportService(session)
        sync_service = DriveSyncService(session)
        chunking_service = ChunkingService()
        embedding_service = get_embedding_service()

        try:
            account = await auth_service.get_account(account_id)
            if not account:
                raise ValueError(f"Account not found: {account_id}")

            # Get file metadata and content
            metadata = await export_service.get_file_metadata(account, drive_file_id)

            if metadata.get("trashed"):
                # File was trashed, delete it
                await delete_file_internal(session, drive_file_id)
                return {"action": "deleted", "file_id": drive_file_id}

            mime_type = metadata.get("mimeType", "")
            content, is_oversized = await export_service.get_file_content(
                account, drive_file_id, mime_type
            )

            # Get file path
            service = await auth_service.get_drive_service(account)
            file_path = await sync_service.get_file_path(service, drive_file_id)

            # Create or update file record
            result = await session.execute(
                select(File).where(
                    File.account_id == account.id,
                    File.file_id == drive_file_id,
                )
            )
            file_record = result.scalar_one_or_none()

            if file_record:
                file_record.name = metadata.get("name", "")
                file_record.path = file_path
                file_record.mime_type = mime_type
                file_record.modified_time = datetime.fromisoformat(
                    metadata.get("modifiedTime", "").replace("Z", "+00:00")
                )
                file_record.content_hash = metadata.get("md5Checksum")
                file_record.size_bytes = int(metadata.get("size", 0))
                file_record.is_oversized = is_oversized
                file_record.trashed = False
                file_record.extraction_error = None
            else:
                file_record = File(
                    account_id=account.id,
                    file_id=drive_file_id,
                    name=metadata.get("name", ""),
                    path=file_path,
                    mime_type=mime_type,
                    modified_time=datetime.fromisoformat(
                        metadata.get("modifiedTime", "").replace("Z", "+00:00")
                    ),
                    content_hash=metadata.get("md5Checksum"),
                    owners=[o.get("emailAddress", "") for o in metadata.get("owners", [])],
                    size_bytes=int(metadata.get("size", 0)),
                    is_oversized=is_oversized,
                )
                session.add(file_record)

            await session.commit()
            await session.refresh(file_record)

            if is_oversized:
                logger.warning("File too large, skipping content", file_id=drive_file_id)
                return {"action": "skipped", "file_id": drive_file_id, "reason": "oversized"}

            # Extract text content
            text_content = extract_content(content, mime_type)
            if not text_content:
                file_record.extraction_error = "No content extracted"
                await session.commit()
                return {"action": "no_content", "file_id": drive_file_id}

            # Delete old chunks
            await session.execute(
                delete(Chunk).where(Chunk.file_id == file_record.id)
            )

            # Chunk the content
            chunks = chunking_service.chunk_text(text_content)

            if chunks:
                # Generate embeddings in batch
                contents = [c.content for c in chunks]
                embeddings = await embedding_service.embed_batch_async(contents)

                # Create chunk records
                for chunk, embedding in zip(chunks, embeddings):
                    chunk_record = Chunk(
                        file_id=file_record.id,
                        chunk_index=chunk.index,
                        content=chunk.content,
                        start_offset=chunk.start_offset,
                        end_offset=chunk.end_offset,
                        heading=chunk.heading,
                        content_hash=chunk.content_hash,
                        embedding=embedding,
                    )
                    session.add(chunk_record)

            await session.commit()

            logger.info(
                "Reindexed file",
                file_id=drive_file_id,
                name=metadata.get("name"),
                chunks=len(chunks),
            )

            return {
                "action": "reindexed",
                "file_id": drive_file_id,
                "chunks": len(chunks),
            }

        except Exception as e:
            logger.error("Reindex failed", file_id=drive_file_id, error=str(e))
            raise


async def delete_file(ctx: dict[str, Any], drive_file_id: str) -> dict[str, Any]:
    """Delete a file and its chunks from the database."""
    async with get_session() as session:
        await delete_file_internal(session, drive_file_id)
        return {"action": "deleted", "file_id": drive_file_id}


async def delete_file_internal(session, drive_file_id: str) -> None:
    """Internal file deletion (CASCADE handles chunks)."""
    result = await session.execute(
        select(File).where(File.file_id == drive_file_id)
    )
    file_record = result.scalar_one_or_none()

    if file_record:
        await session.delete(file_record)
        await session.commit()
        logger.info("Deleted file", file_id=drive_file_id)


async def renew_channels(ctx: dict[str, Any] = None) -> dict[str, Any]:
    """Renew expiring webhook channels."""
    async with get_session() as session:
        watch_service = DriveWatchService(session)

        expiring = await watch_service.get_expiring_channels()
        renewed = 0

        for channel in expiring:
            try:
                await watch_service.renew_channel(channel)
                renewed += 1
            except Exception as e:
                logger.error(
                    "Failed to renew channel",
                    channel_id=channel.channel_id,
                    error=str(e),
                )

        logger.info("Channel renewal complete", renewed=renewed, total=len(expiring))
        return {"renewed": renewed, "total": len(expiring)}


async def sync_notion_task(ctx: dict[str, Any] = None) -> dict[str, Any]:
    """Periodic Notion sync — discover and index all accessible pages."""
    from src.services.notion.sync import NotionSyncService

    async with get_session() as session:
        service = NotionSyncService(session)
        result = await service.sync_all()

    logger.info("Notion sync task complete", **result)
    return result


async def sync_kiwify_task(ctx: dict[str, Any] = None) -> dict[str, Any]:
    """Periodic Kiwify sync — index products and recent sales."""
    from src.services.kiwify.sync import KiwifySyncService

    async with get_session() as session:
        service = KiwifySyncService(session)
        result = await service.sync_all()

    logger.info("Kiwify sync task complete", **result)
    return result
