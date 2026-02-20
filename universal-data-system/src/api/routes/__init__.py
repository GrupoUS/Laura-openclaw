"""API routes module."""

from src.api.routes.context import router as context_router
from src.api.routes.health import router as health_router
from src.api.routes.search import router as search_router
from src.api.routes.sync import router as sync_router
from src.api.routes.webhook import router as webhook_router

__all__ = [
    "context_router",
    "health_router",
    "search_router",
    "sync_router",
    "webhook_router",
]
