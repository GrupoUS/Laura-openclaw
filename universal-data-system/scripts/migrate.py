"""Apply database migrations."""

import asyncio
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent))

import asyncpg

from src.config import get_settings
from src.utils.logging import setup_logging, get_logger

logger = get_logger(__name__)

MIGRATIONS_DIR = Path(__file__).parent.parent / "src" / "db" / "migrations"


async def apply_migrations() -> None:
    """Apply all SQL migrations in order."""
    settings = get_settings()

    # Parse database URL for asyncpg (without +asyncpg)
    db_url = settings.database_url.replace("postgresql+asyncpg://", "postgresql://")

    conn = await asyncpg.connect(db_url)

    try:
        # Get list of migration files
        migrations = sorted(MIGRATIONS_DIR.glob("*.sql"))

        for migration_file in migrations:
            logger.info("Applying migration", file=migration_file.name)

            sql = migration_file.read_text()

            try:
                await conn.execute(sql)
                print(f"✅ Applied: {migration_file.name}")
            except Exception as e:
                if "already exists" in str(e).lower():
                    print(f"⏭️  Skipped (exists): {migration_file.name}")
                else:
                    print(f"❌ Failed: {migration_file.name}")
                    print(f"   Error: {e}")
                    raise

        print(f"\n✅ All {len(migrations)} migrations applied!")

    finally:
        await conn.close()


def main():
    """CLI entry point."""
    setup_logging()
    asyncio.run(apply_migrations())


if __name__ == "__main__":
    main()
