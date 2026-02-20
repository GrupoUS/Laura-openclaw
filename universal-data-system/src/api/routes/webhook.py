"""Google Drive webhook endpoint."""

from fastapi import APIRouter, Depends, Header, HTTPException, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.db import get_db
from src.db.models import DriveChannel
from src.utils.logging import get_logger
from src.workers.tasks import get_arq_pool

logger = get_logger(__name__)

router = APIRouter(prefix="/drive", tags=["webhook"])


@router.post("/webhook")
async def drive_webhook(
    x_goog_channel_id: str = Header(..., alias="X-Goog-Channel-Id"),
    x_goog_resource_id: str = Header(..., alias="X-Goog-Resource-Id"),
    x_goog_resource_state: str = Header(..., alias="X-Goog-Resource-State"),
    x_goog_channel_token: str | None = Header(None, alias="X-Goog-Channel-Token"),
    x_goog_message_number: str | None = Header(None, alias="X-Goog-Message-Number"),
    db: AsyncSession = Depends(get_db),
) -> Response:
    """
    Handle Google Drive push notifications.

    Google sends a POST request when files change in the watched drive.
    We validate the channel and enqueue a sync job.
    """
    logger.info(
        "Received Drive webhook",
        channel_id=x_goog_channel_id,
        resource_id=x_goog_resource_id,
        state=x_goog_resource_state,
        message_num=x_goog_message_number,
    )

    # Validate channel exists and token matches
    result = await db.execute(
        select(DriveChannel).where(DriveChannel.channel_id == x_goog_channel_id)
    )
    channel = result.scalar_one_or_none()

    if not channel:
        logger.warning("Unknown channel", channel_id=x_goog_channel_id)
        raise HTTPException(status_code=403, detail="Invalid channel")

    if channel.token != x_goog_channel_token:
        logger.warning("Token mismatch", channel_id=x_goog_channel_id)
        raise HTTPException(status_code=403, detail="Invalid token")

    # Handle different resource states
    if x_goog_resource_state == "sync":
        # Initial sync message - acknowledge but don't process
        logger.info("Sync message received, channel active")
        return Response(status_code=204)

    if x_goog_resource_state in ("change", "update", "trash", "untrash"):
        # Enqueue sync job
        pool = await get_arq_pool()
        await pool.enqueue_job("sync_changes", str(channel.account_id))
        logger.info("Enqueued sync job", account_id=str(channel.account_id))

    return Response(status_code=204)
