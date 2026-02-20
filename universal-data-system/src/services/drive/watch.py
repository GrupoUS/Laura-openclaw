"""Google Drive changes.watch webhook management."""

import uuid
from datetime import datetime, timedelta, timezone

from googleapiclient.discovery import Resource
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import get_settings
from src.db.models import DriveAccount, DriveChannel, DriveState
from src.services.drive.auth import DriveAuthService
from src.utils.logging import get_logger

logger = get_logger(__name__)

# Maximum channel expiration: 7 days (604800 seconds)
MAX_CHANNEL_EXPIRATION_SECONDS = 604800
# Renew 6 hours before expiration
RENEWAL_BUFFER_SECONDS = 6 * 60 * 60


class DriveWatchService:
    """Service for managing Google Drive webhook channels."""

    def __init__(self, session: AsyncSession) -> None:
        """Initialize the watch service."""
        self.session = session
        self.settings = get_settings()
        self.auth_service = DriveAuthService(session)

    async def create_channel(self, account: DriveAccount) -> DriveChannel:
        """Create a new webhook channel for an account."""
        service = await self.auth_service.get_drive_service(account)

        # Generate unique channel ID and token
        channel_id = str(uuid.uuid4())
        token = str(uuid.uuid4())  # For webhook validation

        # Calculate expiration (max 7 days)
        expiration_ms = int(
            (datetime.now(timezone.utc) + timedelta(seconds=MAX_CHANNEL_EXPIRATION_SECONDS))
            .timestamp() * 1000
        )

        webhook_url = f"{self.settings.webhook_base_url}/drive/webhook"

        logger.info(
            "Creating Drive watch channel",
            account_id=str(account.id),
            channel_id=channel_id,
            webhook_url=webhook_url,
        )

        # Get start page token if not exists
        state = await self._get_or_create_state(account, service)

        # Create the watch channel
        body = {
            "id": channel_id,
            "type": "web_hook",
            "address": webhook_url,
            "token": token,
            "expiration": str(expiration_ms),
        }

        response = service.changes().watch(
            pageToken=state.start_page_token,
            body=body,
        ).execute()

        # Store channel in database
        channel = DriveChannel(
            account_id=account.id,
            channel_id=response["id"],
            resource_id=response["resourceId"],
            token=token,
            expiration=datetime.fromtimestamp(
                int(response["expiration"]) / 1000, tz=timezone.utc
            ),
        )
        self.session.add(channel)
        await self.session.commit()
        await self.session.refresh(channel)

        logger.info(
            "Created Drive watch channel",
            account_id=str(account.id),
            channel_id=channel.channel_id,
            resource_id=channel.resource_id,
            expiration=channel.expiration.isoformat(),
        )

        return channel

    async def stop_channel(self, channel: DriveChannel) -> None:
        """Stop and delete a webhook channel."""
        account = await self.auth_service.get_account(str(channel.account_id))
        if not account:
            logger.warning("Account not found for channel", channel_id=channel.channel_id)
            return

        service = await self.auth_service.get_drive_service(account)

        try:
            service.channels().stop(
                body={
                    "id": channel.channel_id,
                    "resourceId": channel.resource_id,
                }
            ).execute()
            logger.info("Stopped Drive channel", channel_id=channel.channel_id)
        except Exception as e:
            # Channel may already be expired
            logger.warning(
                "Failed to stop channel (may be expired)",
                channel_id=channel.channel_id,
                error=str(e),
            )

        # Delete from database
        await self.session.delete(channel)
        await self.session.commit()

    async def renew_channel(self, channel: DriveChannel) -> DriveChannel:
        """Renew a channel by stopping and recreating it."""
        account = await self.auth_service.get_account(str(channel.account_id))
        if not account:
            raise ValueError(f"Account not found for channel {channel.channel_id}")

        logger.info("Renewing channel", channel_id=channel.channel_id)

        # Stop the old channel
        await self.stop_channel(channel)

        # Create a new channel
        return await self.create_channel(account)

    async def get_expiring_channels(self) -> list[DriveChannel]:
        """Get channels that will expire soon and need renewal."""
        renewal_threshold = datetime.now(timezone.utc) + timedelta(
            seconds=RENEWAL_BUFFER_SECONDS
        )

        result = await self.session.execute(
            select(DriveChannel).where(DriveChannel.expiration <= renewal_threshold)
        )
        return list(result.scalars().all())

    async def get_channel_by_id(self, channel_id: str) -> DriveChannel | None:
        """Get a channel by its Google channel ID."""
        result = await self.session.execute(
            select(DriveChannel).where(DriveChannel.channel_id == channel_id)
        )
        return result.scalar_one_or_none()

    async def _get_or_create_state(
        self, account: DriveAccount, service: Resource
    ) -> DriveState:
        """Get or create sync state for an account."""
        result = await self.session.execute(
            select(DriveState).where(DriveState.account_id == account.id)
        )
        state = result.scalar_one_or_none()

        if state:
            return state

        # Get initial page token from Google
        response = service.changes().getStartPageToken().execute()
        start_token = response["startPageToken"]

        state = DriveState(
            account_id=account.id,
            start_page_token=start_token,
            last_page_token=start_token,
        )
        self.session.add(state)
        await self.session.commit()
        await self.session.refresh(state)

        logger.info(
            "Created drive state",
            account_id=str(account.id),
            start_page_token=start_token,
        )

        return state
