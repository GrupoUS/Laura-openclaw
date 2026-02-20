"""Application configuration using pydantic-settings."""

from functools import lru_cache
from typing import Literal

from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Database
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/uds",
        description="PostgreSQL connection URL",
    )

    # Redis
    redis_url: str = Field(
        default="redis://localhost:6379/0",
        description="Redis connection URL",
    )

    # Google OAuth
    google_client_id: str = Field(default="", description="Google OAuth client ID")
    google_client_secret: str = Field(default="", description="Google OAuth client secret")
    google_redirect_uri: str = Field(
        default="http://localhost:8000/oauth/callback",
        description="Google OAuth redirect URI",
    )

    # Webhook
    webhook_base_url: str = Field(
        default="http://localhost:8000",
        description="Base URL for webhooks",
    )
    webhook_secret: str = Field(
        default="change-me-in-production",
        description="Secret for webhook validation",
    )

    # Embeddings (Gemini)
    gemini_api_key: str = Field(default="", description="Google Gemini API key")
    embedding_model: str = Field(
        default="models/text-embedding-004",
        description="Gemini embedding model",
    )
    embedding_dimensions: int = Field(default=768, description="Embedding vector dimensions (MRL)")

    # Notion
    notion_api_key: str = Field(default="", description="Notion internal integration token")

    # Kiwify
    kiwify_client_id: str = Field(default="", description="Kiwify OAuth client ID")
    kiwify_client_secret: str = Field(default="", description="Kiwify OAuth client secret")
    kiwify_account_id: str = Field(default="", description="Kiwify account ID")

    # Asaas
    asaas_api_key: str = Field(default="", description="Asaas API key")


    # API
    api_host: str = Field(default="0.0.0.0", description="API host")
    api_port: int = Field(default=8000, description="API port")
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = Field(
        default="INFO",
        description="Logging level",
    )

    # Worker
    worker_concurrency: int = Field(default=10, description="Worker concurrency")

    # Chunking
    chunk_size: int = Field(default=1000, description="Target chunk size in characters")
    chunk_overlap: int = Field(default=200, description="Chunk overlap in characters")

    # Search
    search_top_k: int = Field(default=20, description="Default number of search results")
    rrf_k: int = Field(default=60, description="RRF smoothing constant")

    @computed_field
    @property
    def database_url_sync(self) -> str:
        """Sync database URL for Alembic migrations."""
        return self.database_url.replace("+asyncpg", "")


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
