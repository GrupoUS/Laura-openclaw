"""Google Drive file export and download service."""

import io
from typing import Any

from googleapiclient.discovery import Resource
from googleapiclient.http import MediaIoBaseDownload
from sqlalchemy.ext.asyncio import AsyncSession

from src.db.models import DriveAccount
from src.services.drive.auth import DriveAuthService
from src.utils.logging import get_logger

logger = get_logger(__name__)

# Export MIME type mappings for Google Docs
EXPORT_MIME_TYPES = {
    "application/vnd.google-apps.document": "text/plain",
    "application/vnd.google-apps.spreadsheet": "text/csv",
    "application/vnd.google-apps.presentation": "text/plain",
}

# Maximum export size (10MB)
MAX_EXPORT_SIZE = 10 * 1024 * 1024


class DriveExportService:
    """Service for exporting and downloading Google Drive files."""

    def __init__(self, session: AsyncSession) -> None:
        """Initialize the export service."""
        self.session = session
        self.auth_service = DriveAuthService(session)

    async def get_file_content(
        self, account: DriveAccount, file_id: str, mime_type: str
    ) -> tuple[bytes, bool]:
        """
        Get file content, either via export or download.

        Returns (content, is_oversized).
        """
        service = await self.auth_service.get_drive_service(account)

        # Check file size first
        file_meta = service.files().get(
            fileId=file_id,
            fields="size",
        ).execute()

        size = int(file_meta.get("size", 0))
        if size > MAX_EXPORT_SIZE:
            logger.warning(
                "File too large for export",
                file_id=file_id,
                size=size,
                max_size=MAX_EXPORT_SIZE,
            )
            return b"", True

        # Google Workspace files need export
        if mime_type in EXPORT_MIME_TYPES:
            return await self._export_file(service, file_id, mime_type), False

        # Regular files need download
        return await self._download_file(service, file_id), False

    async def _export_file(
        self, service: Resource, file_id: str, mime_type: str
    ) -> bytes:
        """Export a Google Workspace file."""
        export_mime = EXPORT_MIME_TYPES.get(mime_type, "text/plain")

        try:
            request = service.files().export_media(
                fileId=file_id,
                mimeType=export_mime,
            )

            buffer = io.BytesIO()
            downloader = MediaIoBaseDownload(buffer, request)

            done = False
            while not done:
                _, done = downloader.next_chunk()

            content = buffer.getvalue()
            logger.debug("Exported file", file_id=file_id, size=len(content))
            return content

        except Exception as e:
            logger.error("Export failed", file_id=file_id, error=str(e))
            raise

    async def _download_file(self, service: Resource, file_id: str) -> bytes:
        """Download a regular file."""
        try:
            request = service.files().get_media(fileId=file_id)

            buffer = io.BytesIO()
            downloader = MediaIoBaseDownload(buffer, request)

            done = False
            while not done:
                _, done = downloader.next_chunk()

            content = buffer.getvalue()
            logger.debug("Downloaded file", file_id=file_id, size=len(content))
            return content

        except Exception as e:
            logger.error("Download failed", file_id=file_id, error=str(e))
            raise

    async def get_file_metadata(
        self, account: DriveAccount, file_id: str
    ) -> dict[str, Any]:
        """Get file metadata."""
        service = await self.auth_service.get_drive_service(account)

        return service.files().get(
            fileId=file_id,
            fields="id,name,mimeType,modifiedTime,md5Checksum,size,parents,owners,trashed",
        ).execute()
