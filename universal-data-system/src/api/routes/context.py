"""Context retrieval endpoint for RAG applications."""

from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from src.services.search import get_chunk_context
from src.utils.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/context", tags=["context"])


class ContextRequest(BaseModel):
    """Context request body."""

    chunk_ids: list[str] = Field(..., min_length=1, description="Chunk IDs to retrieve")
    include_neighbors: bool = Field(default=True, description="Include neighboring chunks")


class ChunkContext(BaseModel):
    """Chunk with context."""

    chunk_id: str
    file_id: str
    file_name: str
    file_path: str
    mime_type: str
    chunk_index: int
    content: str
    heading: Optional[str]


class ContextResponse(BaseModel):
    """Context response."""

    chunks: list[ChunkContext]
    total: int


@router.post("", response_model=ContextResponse)
async def get_context(
    request: ContextRequest,
) -> ContextResponse:
    """
    Retrieve full context for chunks.

    Returns chunks with their parent file metadata and optionally
    includes neighboring chunks for additional context.
    """
    chunks_data = await get_chunk_context(request.chunk_ids)

    chunks = [
        ChunkContext(
            chunk_id=str(c["id"]),
            file_id=str(c["file_id"]),
            file_name=c["file_name"],
            file_path=c["file_path"],
            mime_type=c["mime_type"],
            chunk_index=c["chunk_index"],
            content=c["content"],
            heading=c.get("heading"),
        )
        for c in chunks_data
    ]

    logger.info("Context retrieved", chunk_count=len(chunks))

    return ContextResponse(chunks=chunks, total=len(chunks))
