
import asyncio
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from arq.worker import create_worker
from src.workers.settings import WorkerSettings
from src.utils.logging import setup_logging

async def main():
    setup_logging()
    print("🚀 Starting local worker (async)...")
    worker = create_worker(WorkerSettings)
    await worker.async_run()

if __name__ == "__main__":
    asyncio.run(main())
