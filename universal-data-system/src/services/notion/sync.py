"""Notion sync service — discovers pages/databases, extracts content, chunks + embeds.

Architecture:
  1. Search API → list all pages the integration can access
  2. Block API → recursively fetch block children → render to plain text
  3. Chunking + Embedding → reuse existing UDS pipeline
  4. Store in files + chunks tables with source_type='notion'
"""

from datetime import datetime, timezone
from typing import Any

import httpx
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import get_settings
from src.db.models import File, Chunk
from src.services.chunking import ChunkingService
from src.services.embeddings import get_embedding_service
from src.utils.logging import get_logger

logger = get_logger(__name__)

NOTION_BASE = "https://api.notion.com/v1"
NOTION_VERSION = "2022-06-28"


class NotionSyncService:
    """Sync Notion pages into UDS for hybrid search."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        settings = get_settings()
        self.api_key = settings.notion_api_key
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Notion-Version": NOTION_VERSION,
            "Content-Type": "application/json",
        }
        self.chunking = ChunkingService()
        self.embeddings = get_embedding_service()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------
    async def sync_all(self) -> dict[str, Any]:
        """Discover all accessible pages and index them."""
        pages = await self._search_all_pages()
        logger.info("Notion pages discovered", count=len(pages))

        synced = 0
        errors = 0

        for page in pages:
            try:
                await self._sync_page(page)
                synced += 1
            except Exception as e:
                errors += 1
                logger.error(
                    "Failed to sync Notion page",
                    page_id=page["id"],
                    title=_get_page_title(page),
                    error=str(e),
                )

        logger.info("Notion sync complete", synced=synced, errors=errors)
        return {"synced": synced, "errors": errors, "total": len(pages)}

    # ------------------------------------------------------------------
    # Discovery
    # ------------------------------------------------------------------
    async def _search_all_pages(self) -> list[dict]:
        """Use Notion Search API to find all accessible pages."""
        all_pages: list[dict] = []
        start_cursor: str | None = None

        async with httpx.AsyncClient(timeout=30) as client:
            while True:
                body: dict[str, Any] = {
                    "filter": {"value": "page", "property": "object"},
                    "page_size": 100,
                }
                if start_cursor:
                    body["start_cursor"] = start_cursor

                resp = await client.post(
                    f"{NOTION_BASE}/search",
                    headers=self.headers,
                    json=body,
                )
                resp.raise_for_status()
                data = resp.json()

                all_pages.extend(data.get("results", []))

                if not data.get("has_more"):
                    break
                start_cursor = data.get("next_cursor")

        return all_pages

    # ------------------------------------------------------------------
    # Page sync
    # ------------------------------------------------------------------
    async def _sync_page(self, page: dict) -> None:
        """Extract, chunk, embed, and store a single Notion page."""
        page_id = page["id"]
        title = _get_page_title(page)
        last_edited = page.get("last_edited_time", "")

        # Check if already indexed with same last_edited_time
        existing = await self.session.execute(
            select(File).where(File.source_type == "notion", File.source_id == page_id)
        )
        file_record = existing.scalar_one_or_none()

        if file_record and last_edited:
            try:
                notion_edited = datetime.fromisoformat(last_edited.replace("Z", "+00:00"))
                if file_record.modified_time >= notion_edited:
                    logger.debug("Notion page unchanged, skipping", page_id=page_id)
                    return
            except (ValueError, TypeError):
                pass

        # Extract page content
        blocks = await self._get_all_blocks(page_id)
        text_content = _blocks_to_text(blocks)

        if not text_content or len(text_content.strip()) < 10:
            logger.debug("Notion page has no content", page_id=page_id, title=title)
            return

        # Prepend title for context
        full_content = f"# {title}\n\n{text_content}" if title else text_content

        # Upsert file record
        modified_time = (
            datetime.fromisoformat(last_edited.replace("Z", "+00:00"))
            if last_edited
            else datetime.now(timezone.utc)
        )

        if file_record:
            file_record.name = title or "Untitled"
            file_record.modified_time = modified_time
        else:
            file_record = File(
                account_id=None,
                source_type="notion",
                source_id=page_id,
                file_id=page_id,
                name=title or "Untitled",
                path=f"/notion/{title or page_id}",
                mime_type="text/notion",
                modified_time=modified_time,
            )
            self.session.add(file_record)

        await self.session.commit()
        await self.session.refresh(file_record)

        # Delete old chunks
        await self.session.execute(
            delete(Chunk).where(Chunk.file_id == file_record.id)
        )

        # Chunk + embed
        chunks = self.chunking.chunk_text(full_content)
        if chunks:
            contents = [c.content for c in chunks]
            embeddings = await self.embeddings.embed_batch_async(contents)

            for chunk, embedding in zip(chunks, embeddings):
                self.session.add(
                    Chunk(
                        file_id=file_record.id,
                        chunk_index=chunk.index,
                        content=chunk.content,
                        start_offset=chunk.start_offset,
                        end_offset=chunk.end_offset,
                        heading=chunk.heading,
                        content_hash=chunk.content_hash,
                        embedding=embedding,
                    )
                )

        await self.session.commit()
        logger.info("Indexed Notion page", page_id=page_id, title=title, chunks=len(chunks))

    # ------------------------------------------------------------------
    # Block extraction
    # ------------------------------------------------------------------
    async def _get_all_blocks(self, block_id: str, depth: int = 0) -> list[dict]:
        """Recursively fetch all blocks from a page (max depth 3)."""
        if depth > 3:
            return []

        all_blocks: list[dict] = []
        start_cursor: str | None = None

        async with httpx.AsyncClient(timeout=30) as client:
            while True:
                url = f"{NOTION_BASE}/blocks/{block_id}/children?page_size=100"
                if start_cursor:
                    url += f"&start_cursor={start_cursor}"

                resp = await client.get(url, headers=self.headers)
                if resp.status_code == 404:
                    break
                resp.raise_for_status()
                data = resp.json()

                for block in data.get("results", []):
                    all_blocks.append(block)
                    if block.get("has_children"):
                        children = await self._get_all_blocks(block["id"], depth + 1)
                        all_blocks.extend(children)

                if not data.get("has_more"):
                    break
                start_cursor = data.get("next_cursor")

        return all_blocks


# ======================================================================
# Helpers (module level for reuse)
# ======================================================================

def _get_page_title(page: dict) -> str:
    """Extract title from a Notion page object."""
    props = page.get("properties", {})
    for prop in props.values():
        if prop.get("type") == "title":
            title_parts = prop.get("title", [])
            return "".join(t.get("plain_text", "") for t in title_parts)
    return ""


def _blocks_to_text(blocks: list[dict]) -> str:
    """Convert Notion blocks to plain text."""
    lines: list[str] = []

    for block in blocks:
        block_type = block.get("type", "")
        block_data = block.get(block_type, {})

        # Extract rich_text content
        rich_text = block_data.get("rich_text", [])
        text = "".join(rt.get("plain_text", "") for rt in rich_text)

        if block_type in ("heading_1",):
            lines.append(f"\n## {text}\n")
        elif block_type in ("heading_2",):
            lines.append(f"\n### {text}\n")
        elif block_type in ("heading_3",):
            lines.append(f"\n#### {text}\n")
        elif block_type == "paragraph":
            if text:
                lines.append(text)
        elif block_type == "bulleted_list_item":
            lines.append(f"• {text}")
        elif block_type == "numbered_list_item":
            lines.append(f"- {text}")
        elif block_type == "to_do":
            checked = "✓" if block_data.get("checked") else "☐"
            lines.append(f"{checked} {text}")
        elif block_type == "toggle":
            lines.append(f"▸ {text}")
        elif block_type == "code":
            lang = block_data.get("language", "")
            lines.append(f"\n```{lang}\n{text}\n```\n")
        elif block_type == "quote":
            lines.append(f"> {text}")
        elif block_type == "callout":
            emoji = block_data.get("icon", {}).get("emoji", "")
            lines.append(f"{emoji} {text}")
        elif block_type == "divider":
            lines.append("---")
        elif block_type == "table_row":
            cells = block_data.get("cells", [])
            row = " | ".join(
                "".join(rt.get("plain_text", "") for rt in cell)
                for cell in cells
            )
            lines.append(f"| {row} |")
        elif block_type == "child_database":
            db_title = block_data.get("title", "")
            lines.append(f"\n[Database: {db_title}]\n")
        elif text:
            lines.append(text)

    return "\n".join(lines)
