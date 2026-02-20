"""Hybrid search service combining BM25 and vector search with RRF fusion."""

from dataclasses import dataclass
from datetime import datetime
from typing import Any

import asyncpg

from src.config import get_settings
from src.utils.logging import get_logger

logger = get_logger(__name__)

# ---------------------------------------------------------------------------
# Dedicated asyncpg pool (bypasses SQLAlchemy prepared-statement cache)
# Best practice for pgvector + asyncpg on PostgreSQL ≥ 17:
#   • statement_cache_size=0  – prevents ResourceOwnerEnlarge errors
#   • jit=off                 – avoids JIT-related crashes with HNSW/BM25
# Reference: https://github.com/pgvector/pgvector#asyncpg
# ---------------------------------------------------------------------------
_asyncpg_pool: asyncpg.Pool | None = None


async def _get_asyncpg_pool() -> asyncpg.Pool:
    """Get or create a dedicated asyncpg connection pool for search queries.

    Using a separate pool (not SQLAlchemy) guarantees:
    - No prepared-statement caching (avoids ResourceOwnerEnlarge on PG17+pgvector)
    - JIT disabled server-side (prevents crashes during HNSW/BM25 index scans)
    - Direct asyncpg Record access for maximum performance
    """
    global _asyncpg_pool
    if _asyncpg_pool is None:
        settings = get_settings()
        # Convert SQLAlchemy DSN format to plain asyncpg DSN
        dsn = settings.database_url.replace("+asyncpg", "")
        _asyncpg_pool = await asyncpg.create_pool(
            dsn,
            min_size=2,
            max_size=5,
            statement_cache_size=0,
            server_settings={"jit": "off"},
        )
    return _asyncpg_pool


async def close_asyncpg_pool() -> None:
    """Gracefully close the asyncpg pool on app shutdown."""
    global _asyncpg_pool
    if _asyncpg_pool is not None:
        await _asyncpg_pool.close()
        _asyncpg_pool = None


@dataclass
class SearchResult:
    """Search result with scores and metadata."""

    chunk_id: str
    file_id: str
    drive_file_id: str
    file_name: str
    file_path: str
    content: str
    heading: str | None
    bm25_score: float
    vector_score: float
    rrf_score: float


class SearchService:
    """Hybrid search service using PostgreSQL BM25 + pgvector.

    All queries run through a dedicated asyncpg pool to avoid
    prepared-statement caching issues with pgvector types.
    """

    def __init__(self) -> None:
        """Initialize search service (no session needed — uses asyncpg pool)."""
        # Lazy import to avoid circular dependencies
        from src.services.embeddings import get_embedding_service

        self.embedding_service = get_embedding_service()

    # ------------------------------------------------------------------
    # Hybrid search (BM25 + Vector + RRF fusion)
    # ------------------------------------------------------------------
    async def hybrid_search(
        self,
        query: str,
        top_k: int = 20,
        path_prefix: str | None = None,
        mime_types: list[str] | None = None,
        modified_after: datetime | None = None,
        modified_before: datetime | None = None,
    ) -> list[SearchResult]:
        """
        Execute hybrid BM25 + vector search with RRF fusion.

        Args:
            query: Search query text
            top_k: Number of results to return
            path_prefix: Filter by file path prefix
            mime_types: Filter by MIME types
            modified_after: Filter by modification date (after)
            modified_before: Filter by modification date (before)

        Returns:
            List of SearchResult ordered by RRF score
        """
        query_embedding = await self.embedding_service.embed_async(query, is_query=True)
        embedding_literal = _to_vector_literal(query_embedding)

        # Inline vector literal is mandatory — pgvector cannot bind vector params
        raw_sql = f"""
            SELECT * FROM hybrid_search(
                $1,
                '{embedding_literal}'::vector(768),
                $2, 60, $3, $4, $5, $6
            )
        """

        pool = await _get_asyncpg_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                raw_sql,
                query, top_k, path_prefix, mime_types,
                modified_after, modified_before,
            )

        results = [
            SearchResult(
                chunk_id=str(row["chunk_id"]),
                file_id=str(row["file_id"]),
                drive_file_id=row["drive_file_id"],
                file_name=row["file_name"],
                file_path=row["file_path"],
                content=row["content"],
                heading=row["heading"],
                bm25_score=float(row["bm25_score"] or 0),
                vector_score=float(row["vector_score"] or 0),
                rrf_score=float(row["rrf_score"] or 0),
            )
            for row in rows
        ]

        logger.info(
            "Hybrid search completed",
            query=query[:50],
            results=len(results),
            top_score=results[0].rrf_score if results else 0,
        )
        return results

    # ------------------------------------------------------------------
    # BM25-only keyword search
    # ------------------------------------------------------------------
    async def bm25_search(
        self,
        query: str,
        top_k: int = 20,
        path_prefix: str | None = None,
    ) -> list[SearchResult]:
        """Execute BM25-only keyword search.

        Note: bm25_search() SQL function returns only
        (chunk_id, file_id, content, score). We join with files
        to get full metadata for a consistent SearchResult.
        """
        raw_sql = """
            SELECT
                b.chunk_id,
                b.file_id,
                f.file_id   AS drive_file_id,
                f.name      AS file_name,
                f.path      AS file_path,
                b.content,
                c.heading,
                b.score     AS bm25_score
            FROM bm25_search($1, $2, $3) b
            JOIN files   f ON f.id = b.file_id
            JOIN chunks  c ON c.id = b.chunk_id
        """

        pool = await _get_asyncpg_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(raw_sql, query, top_k, path_prefix)

        return [
            SearchResult(
                chunk_id=str(row["chunk_id"]),
                file_id=str(row["file_id"]),
                drive_file_id=row["drive_file_id"],
                file_name=row["file_name"],
                file_path=row["file_path"],
                content=row["content"],
                heading=row["heading"],
                bm25_score=float(row["bm25_score"] or 0),
                vector_score=0.0,
                rrf_score=0.0,
            )
            for row in rows
        ]

    # ------------------------------------------------------------------
    # Vector-only semantic search
    # ------------------------------------------------------------------
    async def vector_search(
        self,
        query: str,
        top_k: int = 20,
        path_prefix: str | None = None,
    ) -> list[SearchResult]:
        """Execute vector-only semantic search.

        Note: vector_search() SQL function returns only
        (chunk_id, file_id, content, similarity). We join with files
        to get full metadata for a consistent SearchResult.
        """
        query_embedding = await self.embedding_service.embed_async(query, is_query=True)
        embedding_literal = _to_vector_literal(query_embedding)

        # Inline vector literal — pgvector cannot use bind params for vector type
        raw_sql = f"""
            SELECT
                v.chunk_id,
                v.file_id,
                f.file_id    AS drive_file_id,
                f.name       AS file_name,
                f.path       AS file_path,
                v.content,
                c.heading,
                v.similarity AS vector_score
            FROM vector_search(
                '{embedding_literal}'::vector(768),
                $1, $2
            ) v
            JOIN files   f ON f.id = v.file_id
            JOIN chunks  c ON c.id = v.chunk_id
        """

        pool = await _get_asyncpg_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(raw_sql, top_k, path_prefix)

        return [
            SearchResult(
                chunk_id=str(row["chunk_id"]),
                file_id=str(row["file_id"]),
                drive_file_id=row["drive_file_id"],
                file_name=row["file_name"],
                file_path=row["file_path"],
                content=row["content"],
                heading=row["heading"],
                bm25_score=0.0,
                vector_score=float(row["vector_score"] or 0),
                rrf_score=0.0,
            )
            for row in rows
        ]


# ======================================================================
# Context retrieval (does NOT use pgvector → safe with SQLAlchemy)
# ======================================================================
async def get_chunk_context(
    chunk_ids: list[str],
) -> list[dict[str, Any]]:
    """
    Get full context for chunks including parent document.

    Returns chunks with their file metadata and neighboring chunks.
    """
    if not chunk_ids:
        return []

    raw_sql = """
        WITH target_chunks AS (
            SELECT c.*, f.name AS file_name, f.path AS file_path, f.mime_type
            FROM chunks c
            JOIN files f ON c.file_id = f.id
            WHERE c.id = ANY($1::uuid[])
        ),
        neighbors AS (
            SELECT c.*, tc.file_name, tc.file_path, tc.mime_type
            FROM chunks c
            JOIN target_chunks tc ON c.file_id = tc.file_id
            WHERE c.chunk_index BETWEEN tc.chunk_index - 1 AND tc.chunk_index + 1
        )
        SELECT DISTINCT * FROM neighbors
        ORDER BY file_id, chunk_index
    """

    pool = await _get_asyncpg_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(raw_sql, chunk_ids)

    return [dict(row) for row in rows]


# ======================================================================
# Helpers
# ======================================================================
def _to_vector_literal(embedding: list[float]) -> str:
    """Convert a Python float list to a pgvector literal string."""
    return "[" + ",".join(str(x) for x in embedding) + "]"
