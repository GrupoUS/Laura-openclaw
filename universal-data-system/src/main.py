"""FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api import context_router, health_router, search_router, sync_router, webhook_router, ontology_router
from src.config import get_settings
from src.db import close_db
from src.services.search import close_asyncpg_pool
from src.utils.logging import setup_logging, get_logger

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    setup_logging()
    logger.info("Starting Universal Data System API")

    yield

    # Shutdown
    await close_asyncpg_pool()
    await close_db()
    logger.info("Shutting down Universal Data System API")


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title="Universal Data System",
        description="Near real-time searchable knowledge base from Google Drive",
        version="0.1.0",
        lifespan=lifespan,
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Configure appropriately for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    app.include_router(health_router)
    app.include_router(webhook_router)
    app.include_router(search_router)
    app.include_router(context_router)
    app.include_router(sync_router)
    app.include_router(ontology_router)

    return app


# Create app instance
app = create_app()


if __name__ == "__main__":
    import uvicorn

    settings = get_settings()
    uvicorn.run(
        "src.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=True,
        log_level=settings.log_level.lower(),
    )
