"""OAuth setup script for Google Drive authentication."""

import asyncio
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from google_auth_oauthlib.flow import InstalledAppFlow

from src.config import get_settings
from src.db import get_session
from src.services.drive import get_or_create_account, SCOPES
from src.utils.logging import setup_logging, get_logger

logger = get_logger(__name__)


def run_oauth_flow() -> dict:
    """Run OAuth flow and return credentials."""
    settings = get_settings()

    client_config = {
        "installed": {
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": ["http://localhost:8080"],
        }
    }

    flow = InstalledAppFlow.from_client_config(client_config, SCOPES)

    print("\n🔐 Starting OAuth flow...")
    print("A browser window will open for Google authentication.\n")

    creds = flow.run_local_server(port=8080, open_browser=True)

    return creds


async def save_account(creds) -> None:
    """Save OAuth credentials to database."""
    # Get user email from token
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build

    service = build("oauth2", "v2", credentials=creds)
    user_info = service.userinfo().get().execute()
    email = user_info.get("email")

    async with get_session() as session:
        account = await get_or_create_account(session, email, creds)

        print(f"\n✅ Account saved!")
        print(f"   - Email: {email}")
        print(f"   - Account ID: {account.id}")
        print(f"\nNext steps:")
        print(f"   1. Run: python scripts/bootstrap_index.py --account-id {account.id}")
        print(f"   2. Start worker: arq src.workers.settings.WorkerSettings")


def main():
    """CLI entry point."""
    setup_logging()
    settings = get_settings()

    if not settings.google_client_id or not settings.google_client_secret:
        print("❌ Error: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env")
        print("\nGet credentials from: https://console.cloud.google.com/apis/credentials")
        sys.exit(1)

    # Run OAuth flow
    creds = run_oauth_flow()

    # Save to database
    asyncio.run(save_account(creds))


if __name__ == "__main__":
    main()
