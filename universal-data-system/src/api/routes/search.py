"""Search API endpoints."""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from src.api.deps import get_search_service
from src.services.search import SearchService
from src.services.tavily import TavilyService
from src.utils.logging import get_logger

logger = get_logger(__name__)

tavily_service = TavilyService()

router = APIRouter(prefix="/search", tags=["search"])


class SearchRequest(BaseModel):
    """Search request body."""

    query: str = Field(..., min_length=1, description="Search query text")
    top_k: int = Field(default=20, ge=1, le=100, description="Number of results")
    path_prefix: Optional[str] = Field(default=None, description="Filter by path prefix")
    mime_types: Optional[list[str]] = Field(default=None, description="Filter by MIME types")
    modified_after: Optional[datetime] = Field(default=None, description="Modified after date")
    modified_before: Optional[datetime] = Field(default=None, description="Modified before date")
    search_type: str = Field(default="hybrid", description="Search type: hybrid, bm25, vector")
    auto_fallback: bool = Field(default=False, description="Use Tavily web search if local confidence is low")


class SearchResultItem(BaseModel):
    """Search result item."""

    chunk_id: str
    file_id: str
    drive_file_id: str
    file_name: str
    file_path: str
    content: str
    heading: Optional[str]
    bm25_score: float
    vector_score: float
    rrf_score: float


class SearchResponse(BaseModel):
    """Search response."""

    query: str
    results: list[SearchResultItem]
    total: int
    search_type: str


@router.post("", response_model=SearchResponse)
async def search(
    request: SearchRequest,
    service: SearchService = Depends(get_search_service),
) -> SearchResponse:
    """
    Execute hybrid BM25 + vector search with RRF fusion.

    Supports filtering by path prefix, MIME types, and modification dates.
    """
    if request.search_type == "bm25":
        results = await service.bm25_search(
            query=request.query,
            top_k=request.top_k,
            path_prefix=request.path_prefix,
        )
    elif request.search_type == "vector":
        results = await service.vector_search(
            query=request.query,
            top_k=request.top_k,
            path_prefix=request.path_prefix,
        )
    else:
        results = await service.hybrid_search(
            query=request.query,
            top_k=request.top_k,
            path_prefix=request.path_prefix,
            mime_types=request.mime_types,
            modified_after=request.modified_after,
            modified_before=request.modified_before,
            auto_fallback=request.auto_fallback,
        )

    logger.info(
        "Search executed",
        query=request.query[:50],
        results=len(results),
        type=request.search_type,
    )

    return SearchResponse(
        query=request.query,
        results=[
            SearchResultItem(
                chunk_id=r.chunk_id,
                file_id=r.file_id,
                drive_file_id=r.drive_file_id,
                file_name=r.file_name,
                file_path=r.file_path,
                content=r.content,
                heading=r.heading,
                bm25_score=r.bm25_score,
                vector_score=r.vector_score,
                rrf_score=r.rrf_score,
            )
            for r in results
        ],
        total=len(results),
        search_type=request.search_type,
    )

class WebSearchRequest(BaseModel):
    """Web search request body."""

    query: str = Field(..., min_length=1, description="Search query text")
    search_depth: str = Field(default="basic", description="Search depth: basic or advanced")
    topic: str = Field(default="general", description="Search topic: general or news")
    max_results: int = Field(default=5, ge=1, le=20, description="Number of results")

@router.post("/web")
async def web_search(request: WebSearchRequest):
    """Execute AI-optimized web search via Tavily API."""
    logger.info("Web search executed", query=request.query[:50])
    results = await tavily_service.search(
        query=request.query,
        search_depth=request.search_depth,
        topic=request.topic,
        max_results=request.max_results,
    )
    return results
