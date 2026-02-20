"""API dependencies."""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.db import get_db as _get_db
from src.services.embeddings import GeminiEmbeddingService, get_embedding_service
from src.services.search import SearchService

# Type aliases for FastAPI dependencies
DatabaseDep = Annotated[AsyncSession, Depends(_get_db)]


def get_search_service() -> SearchService:
    """Get search service (no database session needed — uses asyncpg pool)."""
    return SearchService()


SearchServiceDep = Annotated[SearchService, Depends(get_search_service)]
EmbeddingServiceDep = Annotated[GeminiEmbeddingService, Depends(get_embedding_service)]
