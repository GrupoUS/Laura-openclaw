"""Inject account from openclaw token."""

import asyncio
import sys
import json
from datetime import datetime, timezone
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select, update
from src.db import get_session
from src.db.models import DriveAccount

TOKEN_PATH = "/Users/mauricio/openclaw/config/google-token.json"
USER_EMAIL = "suporte@drasacha.com.br"

async def inject_account():
    with open(TOKEN_PATH) as f:
        token_data = json.load(f)

    expiry = datetime.fromtimestamp(token_data["expiry_date"] / 1000, tz=timezone.utc)
    scopes = token_data["scope"].split(" ")

    async with get_session() as session:
        # Check if exists
        result = await session.execute(select(DriveAccount).where(DriveAccount.user_email == USER_EMAIL))
        account = result.scalar_one_or_none()

        if account:
            print(f"Updating existing account {USER_EMAIL}...")
            account.access_token = token_data["access_token"]
            account.refresh_token = token_data["refresh_token"]
            account.token_expiry = expiry
            account.scopes = scopes
            account.updated_at = datetime.now(timezone.utc)
        else:
            print(f"Creating new account {USER_EMAIL}...")
            account = DriveAccount(
                user_email=USER_EMAIL,
                access_token=token_data["access_token"],
                refresh_token=token_data["refresh_token"],
                token_expiry=expiry,
                scopes=scopes
            )
            session.add(account)
        
        await session.commit()
        await session.refresh(account)
        print(f"✅ Account injected! ID: {account.id}")

if __name__ == "__main__":
    asyncio.run(inject_account())
