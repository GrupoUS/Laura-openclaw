"""Google Drive sync service using changes.list API."""

from datetime import datetime, timezone
from typing import Any

from googleapiclient.discovery import Resource
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import DriveAccount, DriveState, File
from src.services.drive.auth import DriveAuthService
from src.utils.logging import get_logger

logger = get_logger(__name__)

# MIME types we can index
INDEXABLE_MIME_TYPES = {
    # Google Workspace
    "application/vnd.google-apps.document",
    "application/vnd.google-apps.spreadsheet",
    "application/vnd.google-apps.presentation",
    # Office formats
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    # Text formats
    "text/plain",
    "text/markdown",
    "text/html",
}


class DriveSyncService:
    """Service for syncing Google Drive changes."""

    def __init__(self, session: AsyncSession) -> None:
        """Initialize the sync service."""
        self.session = session
        self.auth_service = DriveAuthService(session)

    async def sync_changes(self, account_id: str) -> list[dict[str, Any]]:
        """
        Sync changes for an account.

        Returns list of changes processed.
        """
        account = await self.auth_service.get_account(account_id)
        if not account:
            raise ValueError(f"Account not found: {account_id}")

        service = await self.auth_service.get_drive_service(account)
        state = await self._get_state(account)

        if not state:
            logger.warning("No sync state found", account_id=account_id)
            return []

        changes_processed = []
        page_token = state.last_page_token

        while True:
            response = service.changes().list(
                pageToken=page_token,
                spaces="drive",
                fields="nextPageToken,newStartPageToken,changes(fileId,removed,file(id,name,mimeType,modifiedTime,md5Checksum,size,trashed,parents,owners))",
                includeItemsFromAllDrives=False,
                supportsAllDrives=False,
            ).execute()

            for change in response.get("changes", []):
                change_info = await self._process_change(account, change)
                if change_info:
                    changes_processed.append(change_info)

            # Check if there are more pages
            if "newStartPageToken" in response:
                # All changes processed
                state.last_page_token = response["newStartPageToken"]
                state.last_sync_at = datetime.now(timezone.utc)
                await self.session.commit()
                break

            page_token = response.get("nextPageToken")
            if page_token:
                state.last_page_token = page_token
                await self.session.commit()
            else:
                break

        logger.info(
            "Sync completed",
            account_id=account_id,
            changes_count=len(changes_processed),
        )

        return changes_processed

    async def _process_change(
        self, account: DriveAccount, change: dict[str, Any]
    ) -> dict[str, Any] | None:
        """Process a single change from changes.list."""
        file_id = change.get("fileId")
        if not file_id:
            return None

        removed = change.get("removed", False)
        file_data = change.get("file", {})
        trashed = file_data.get("trashed", False)

        if removed or trashed:
            logger.info("File removed/trashed", file_id=file_id)
            return {
                "action": "delete",
                "file_id": file_id,
            }

        # Check if mime type is indexable
        mime_type = file_data.get("mimeType", "")
        if mime_type not in INDEXABLE_MIME_TYPES:
            logger.debug("Skipping non-indexable file", file_id=file_id, mime_type=mime_type)
            return None

        logger.info(
            "File changed",
            file_id=file_id,
            name=file_data.get("name"),
            mime_type=mime_type,
        )

        return {
            "action": "reindex",
            "file_id": file_id,
            "name": file_data.get("name"),
            "mime_type": mime_type,
            "modified_time": file_data.get("modifiedTime"),
            "md5": file_data.get("md5Checksum"),
            "size": file_data.get("size"),
        }

    async def get_file_path(self, service: Resource, file_id: str) -> str:
        """Build the full path for a file by traversing parents."""
        path_parts = []

        current_id = file_id
        while current_id:
            try:
                file = service.files().get(
                    fileId=current_id,
                    fields="name,parents",
                ).execute()

                path_parts.insert(0, file.get("name", ""))

                parents = file.get("parents", [])
                current_id = parents[0] if parents else None
            except Exception:
                break

        return "/" + "/".join(path_parts) if path_parts else "/"

    async def list_all_files(
        self, account: DriveAccount, page_size: int = 100
    ) -> list[dict[str, Any]]:
        """List all indexable files in Drive (for initial bootstrap)."""
        service = await self.auth_service.get_drive_service(account)

        all_files = []
        page_token = None

        # Build query for indexable mime types
        mime_queries = [f"mimeType='{mt}'" for mt in INDEXABLE_MIME_TYPES]
        query = f"({' or '.join(mime_queries)}) and trashed=false"

        while True:
            response = service.files().list(
                q=query,
                pageSize=page_size,
                pageToken=page_token,
                fields="nextPageToken,files(id,name,mimeType,modifiedTime,md5Checksum,size,parents,owners)",
                spaces="drive",
            ).execute()

            for file_data in response.get("files", []):
                # Use simple path (name only) for bootstrap speed
                name = file_data.get("name", "")
                path = "/" + name

                all_files.append({
                    "file_id": file_data["id"],
                    "name": name,
                    "path": path,
                    "mime_type": file_data.get("mimeType", ""),
                    "modified_time": file_data.get("modifiedTime"),
                    "md5": file_data.get("md5Checksum"),
                    "size": file_data.get("size"),
                    "owners": [o.get("emailAddress", "") for o in file_data.get("owners", [])],
                })
            
            logger.info("Listed page", files_so_far=len(all_files))

            page_token = response.get("nextPageToken")
            if not page_token:
                break

        logger.info("Listed all files", account_id=str(account.id), count=len(all_files))
        return all_files

    async def _get_state(self, account: DriveAccount) -> DriveState | None:
        """Get sync state for an account."""
        result = await self.session.execute(
            select(DriveState).where(DriveState.account_id == account.id)
        )
        return result.scalar_one_or_none()
