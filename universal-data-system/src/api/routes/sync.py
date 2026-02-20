"""Sync trigger API endpoints — manual triggers for data source indexing."""

from fastapi import APIRouter
from pydantic import BaseModel

from src.db import get_session
from src.services.notion.sync import NotionSyncService
from src.services.kiwify.sync import KiwifySyncService
from src.services.asaas.sync import AsaasSyncService
from src.services.drive.sync import DriveSyncService
from src.services.drive.auth import DriveAuthService
from src.utils.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/sync", tags=["sync"])


class SyncResponse(BaseModel):
    """Sync operation response."""

    source: str
    status: str
    details: dict = {}


@router.post("/notion", response_model=SyncResponse)
async def sync_notion() -> SyncResponse:
    """Trigger full Notion sync — discover pages, extract, chunk, embed."""
    async with get_session() as session:
        service = NotionSyncService(session)
        result = await service.sync_all()

    return SyncResponse(source="notion", status="completed", details=result)


@router.post("/kiwify", response_model=SyncResponse)
async def sync_kiwify() -> SyncResponse:
    """Trigger full Kiwify sync — products + recent sales."""
    async with get_session() as session:
        service = KiwifySyncService(session)
        result = await service.sync_all()

    return SyncResponse(source="kiwify", status="completed", details=result)


@router.post("/asaas", response_model=SyncResponse)
async def sync_asaas() -> SyncResponse:
    """Trigger full Asaas sync — customers + subscriptions + payments."""
    async with get_session() as session:
        service = AsaasSyncService(session)
        result = await service.sync_all()

    return SyncResponse(source="asaas", status="completed", details=result)


@router.post("/drive", response_model=SyncResponse)
async def sync_drive() -> SyncResponse:
    """Trigger manual Drive sync for all accounts."""
    async with get_session() as session:
        from sqlalchemy import select
        from src.db.models import DriveAccount

        result = await session.execute(select(DriveAccount))
        accounts = list(result.scalars().all())

        if not accounts:
            return SyncResponse(
                source="drive", status="no_accounts", details={"message": "No Drive accounts configured"}
            )

        total_changes = 0
        for account in accounts:
            sync_service = DriveSyncService(session)
            try:
                changes = await sync_service.sync_changes(str(account.id))
                total_changes += len(changes)
            except Exception as e:
                logger.error("Drive sync failed", account=account.user_email, error=str(e))

    return SyncResponse(
        source="drive",
        status="completed",
        details={"accounts": len(accounts), "changes": total_changes},
    )


@router.get("/status")
async def sync_status() -> dict:
    """Get sync status — count of indexed files by source."""
    from sqlalchemy import func, select
    from src.db.models import File

    async with get_session() as session:
        result = await session.execute(
            select(File.source_type, func.count(File.id)).group_by(File.source_type)
        )
        counts = {row[0]: row[1] for row in result.all()}

    return {
        "sources": counts,
        "total_files": sum(counts.values()),
    }
