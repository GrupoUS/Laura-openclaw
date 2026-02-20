"""Health check endpoint."""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check() -> dict:
    """Health check endpoint."""
    return {"status": "ok"}


@router.get("/")
async def root() -> dict:
    """Root endpoint."""
    return {
        "name": "Universal Data System",
        "version": "0.1.0",
        "status": "ok",
    }
