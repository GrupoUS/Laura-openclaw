"""arq worker settings."""

from arq import cron
from arq.connections import RedisSettings

from src.config import get_settings
from src.workers.tasks import (
    sync_changes,
    reindex_file,
    delete_file,
    renew_channels,
    sync_notion_task,
    sync_kiwify_task,
)


def get_redis_settings() -> RedisSettings:
    """Get Redis settings for arq."""
    settings = get_settings()
    # Parse redis://host:port/db URL
    url = settings.redis_url
    if url.startswith("redis://"):
        url = url[8:]

    parts = url.split("/")
    host_port = parts[0]
    database = int(parts[1]) if len(parts) > 1 else 0

    if ":" in host_port:
        host, port = host_port.split(":")
        port = int(port)
    else:
        host = host_port
        port = 6379

    return RedisSettings(host=host, port=port, database=database)


class WorkerSettings:
    """arq worker settings."""

    functions = [
        sync_changes,
        reindex_file,
        delete_file,
        renew_channels,
        sync_notion_task,
        sync_kiwify_task,
    ]

    redis_settings = get_redis_settings()

    # Cron jobs
    cron_jobs = [
        # Renew Drive channels every 6 hours
        cron(renew_channels, hour={0, 6, 12, 18}, minute=0),
        # Sync Notion every 6 hours
        cron(sync_notion_task, hour={1, 7, 13, 19}, minute=0),
        # Sync Kiwify every 6 hours (offset by 30 min to avoid overlap)
        cron(sync_kiwify_task, hour={1, 7, 13, 19}, minute=30),
    ]

    # Worker settings
    max_jobs = get_settings().worker_concurrency
    job_timeout = 600  # 10 minutes (Notion/Kiwify sync can be slow)
    keep_result = 3600  # 1 hour
    retry_jobs = True
    max_tries = 3
