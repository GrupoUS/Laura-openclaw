"""Bootstrap script for initial Google Drive indexing."""

import asyncio
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.config import get_settings
from src.db import get_session
from src.db.models import DriveAccount
from src.services.drive import DriveAuthService, DriveSyncService, DriveWatchService
from src.workers.tasks import get_arq_pool
from src.utils.logging import setup_logging, get_logger

logger = get_logger(__name__)


async def bootstrap_account(account_id: str) -> None:
    """Bootstrap indexing for a specific account."""
    async with get_session() as session:
        auth_service = DriveAuthService(session)
        sync_service = DriveSyncService(session)
        watch_service = DriveWatchService(session)

        account = await auth_service.get_account(account_id)
        if not account:
            logger.error("Account not found", account_id=account_id)
            return

        logger.info("Starting bootstrap", email=account.user_email)

        # 1. List all indexable files
        files = await sync_service.list_all_files(account)
        logger.info("Found files to index", count=len(files))

        # 2. Enqueue reindex jobs for all files
        pool = await get_arq_pool()
        for file_info in files:
            await pool.enqueue_job("reindex_file", account_id, file_info["file_id"])
            logger.debug("Enqueued", file_id=file_info["file_id"], name=file_info["name"])

        logger.info("Enqueued all files for indexing", count=len(files))

        # 3. Create watch channel for future updates
        channel = await watch_service.create_channel(account)
        logger.info(
            "Created watch channel",
            channel_id=channel.channel_id,
            expiration=channel.expiration.isoformat(),
        )

        print(f"\n✅ Bootstrap complete!")
        print(f"   - Account: {account.user_email}")
        print(f"   - Files queued: {len(files)}")
        print(f"   - Watch channel: {channel.channel_id}")
        print(f"   - Expires: {channel.expiration}")
        print(f"\nRun `arq src.workers.settings.WorkerSettings` to process the queue.")


async def bootstrap_all() -> None:
    """Bootstrap all configured accounts."""
    async with get_session() as session:
        from sqlalchemy import select

        result = await session.execute(select(DriveAccount))
        accounts = result.scalars().all()

        if not accounts:
            print("No accounts found. Run setup_oauth.py first.")
            return

        for account in accounts:
            await bootstrap_account(str(account.id))


def main():
    """CLI entry point."""
    setup_logging()

    import argparse
    parser = argparse.ArgumentParser(description="Bootstrap Google Drive indexing")
    parser.add_argument("--account-id", help="Specific account ID to bootstrap")
    parser.add_argument("--all", action="store_true", help="Bootstrap all accounts")
    args = parser.parse_args()

    if args.account_id:
        asyncio.run(bootstrap_account(args.account_id))
    elif args.all:
        asyncio.run(bootstrap_all())
    else:
        parser.print_help()
        print("\nUse --all to bootstrap all accounts, or --account-id for a specific one.")


if __name__ == "__main__":
    main()
