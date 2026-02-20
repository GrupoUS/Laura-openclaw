"""Google Drive OAuth authentication service."""

from datetime import datetime, timedelta, timezone
from typing import Any

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build, Resource
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import get_settings
from src.db.models import DriveAccount
from src.utils.logging import get_logger

logger = get_logger(__name__)

# Google Drive API scopes
SCOPES = [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/drive.metadata.readonly",
]


class DriveAuthService:
    """Service for Google Drive OAuth authentication."""

    def __init__(self, session: AsyncSession) -> None:
        """Initialize the auth service."""
        self.session = session
        self.settings = get_settings()

    async def get_account(self, account_id: str) -> DriveAccount | None:
        """Get a drive account by ID."""
        result = await self.session.execute(
            select(DriveAccount).where(DriveAccount.id == account_id)
        )
        return result.scalar_one_or_none()

    async def get_account_by_email(self, email: str) -> DriveAccount | None:
        """Get a drive account by email."""
        result = await self.session.execute(
            select(DriveAccount).where(DriveAccount.user_email == email)
        )
        return result.scalar_one_or_none()

    async def get_credentials(self, account: DriveAccount) -> Credentials:
        """Get valid credentials for an account, refreshing if needed."""
        creds = Credentials(
            token=account.access_token,
            refresh_token=account.refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=self.settings.google_client_id,
            client_secret=self.settings.google_client_secret,
            scopes=account.scopes,
        )

        # Check if token needs refresh
        if account.token_expiry <= datetime.now(timezone.utc):
            logger.info("Refreshing expired token", email=account.user_email)
            creds.refresh(Request())

            # Update stored tokens
            account.access_token = creds.token
            if creds.refresh_token:
                account.refresh_token = creds.refresh_token
            account.token_expiry = creds.expiry or (
                datetime.now(timezone.utc) + timedelta(hours=1)
            )
            await self.session.commit()

        return creds

    async def create_account(
        self,
        email: str,
        access_token: str,
        refresh_token: str,
        token_expiry: datetime,
        scopes: list[str],
    ) -> DriveAccount:
        """Create a new drive account."""
        account = DriveAccount(
            user_email=email,
            access_token=access_token,
            refresh_token=refresh_token,
            token_expiry=token_expiry,
            scopes=scopes,
        )
        self.session.add(account)
        await self.session.commit()
        await self.session.refresh(account)

        logger.info("Created drive account", email=email, account_id=str(account.id))
        return account

    async def get_drive_service(self, account: DriveAccount) -> Resource:
        """Get authenticated Drive API service."""
        creds = await self.get_credentials(account)
        return build("drive", "v3", credentials=creds)


def create_oauth_flow() -> InstalledAppFlow:
    """Create OAuth flow for initial authentication."""
    settings = get_settings()

    client_config = {
        "installed": {
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [settings.google_redirect_uri],
        }
    }

    return InstalledAppFlow.from_client_config(client_config, SCOPES)


async def get_or_create_account(
    session: AsyncSession,
    email: str,
    creds: Credentials,
) -> DriveAccount:
    """Get existing account or create new one from credentials."""
    auth_service = DriveAuthService(session)

    account = await auth_service.get_account_by_email(email)
    if account:
        # Update tokens
        account.access_token = creds.token
        if creds.refresh_token:
            account.refresh_token = creds.refresh_token
        account.token_expiry = creds.expiry or (datetime.now(timezone.utc) + timedelta(hours=1))
        await session.commit()
        return account

    return await auth_service.create_account(
        email=email,
        access_token=creds.token,
        refresh_token=creds.refresh_token or "",
        token_expiry=creds.expiry or (datetime.now(timezone.utc) + timedelta(hours=1)),
        scopes=list(creds.scopes or SCOPES),
    )
