"""Gemini embedding service using gemini-embedding-001 with MRL (768d)."""

import asyncio
from functools import lru_cache

import google.generativeai as genai

from src.config import get_settings
from src.utils.logging import get_logger

logger = get_logger(__name__)


class GeminiEmbeddingService:
    """
    Embedding service using Google Gemini gemini-embedding-001.

    Uses Matryoshka Representation Learning (MRL) to output 768-dim vectors,
    reducing storage by 50% vs 1536 dims while maintaining quality.
    """

    MODEL = "models/gemini-embedding-001"
    DIMENSIONS = 768  # MRL optimized - 50% less storage than 1536
    TASK_TYPE = "RETRIEVAL_DOCUMENT"  # For indexing
    QUERY_TASK_TYPE = "RETRIEVAL_QUERY"  # For search queries

    def __init__(self) -> None:
        """Initialize the embedding service."""
        settings = get_settings()
        genai.configure(api_key=settings.gemini_api_key)
        self.settings = settings

    def embed(self, text: str, is_query: bool = False) -> list[float]:
        """
        Generate embedding for a single text.

        Args:
            text: Text to embed
            is_query: If True, use RETRIEVAL_QUERY task type

        Returns:
            768-dimensional embedding vector
        """
        task_type = self.QUERY_TASK_TYPE if is_query else self.TASK_TYPE

        try:
            result = genai.embed_content(
                model=self.MODEL,
                content=text,
                task_type=task_type,
                output_dimensionality=self.DIMENSIONS,
            )

            embedding = result["embedding"]
            logger.debug(
                "Generated embedding",
                chars=len(text),
                dims=len(embedding),
                is_query=is_query,
            )
            return embedding

        except Exception as e:
            logger.error("Embedding generation failed", error=str(e))
            raise

    def embed_batch(
        self,
        texts: list[str],
        is_query: bool = False,
    ) -> list[list[float]]:
        """
        Generate embeddings for multiple texts.

        Args:
            texts: List of texts to embed
            is_query: If True, use RETRIEVAL_QUERY task type

        Returns:
            List of 768-dimensional embedding vectors
        """
        if not texts:
            return []

        task_type = self.QUERY_TASK_TYPE if is_query else self.TASK_TYPE

        try:
            result = genai.embed_content(
                model=self.MODEL,
                content=texts,
                task_type=task_type,
                output_dimensionality=self.DIMENSIONS,
            )

            embeddings = result["embedding"]
            logger.debug(
                "Generated batch embeddings",
                count=len(texts),
                dims=self.DIMENSIONS,
            )
            return embeddings

        except Exception as e:
            logger.error("Batch embedding generation failed", error=str(e))
            raise

    async def embed_async(self, text: str, is_query: bool = False) -> list[float]:
        """Async wrapper for embed()."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.embed, text, is_query)

    async def embed_batch_async(
        self,
        texts: list[str],
        is_query: bool = False,
    ) -> list[list[float]]:
        """Async wrapper for embed_batch()."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self.embed_batch, texts, is_query)


@lru_cache(maxsize=1)
def get_embedding_service() -> GeminiEmbeddingService:
    """Get singleton embedding service instance."""
    return GeminiEmbeddingService()
