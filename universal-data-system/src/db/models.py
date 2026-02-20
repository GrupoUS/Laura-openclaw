"""SQLAlchemy ORM models for Universal Data System."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    BigInteger,
)
from sqlalchemy.dialects.postgresql import ARRAY, UUID as PG_UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Base class for all models."""

    pass


class DriveAccount(Base):
    """Google Drive account with OAuth tokens."""

    __tablename__ = "drive_accounts"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, server_default="uuid_generate_v4()"
    )
    user_email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    access_token: Mapped[str] = mapped_column(Text, nullable=False)
    refresh_token: Mapped[str] = mapped_column(Text, nullable=False)
    token_expiry: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    scopes: Mapped[list[str]] = mapped_column(ARRAY(Text), default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default="NOW()", nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default="NOW()", nullable=False
    )

    # Relationships
    channels: Mapped[list["DriveChannel"]] = relationship(
        back_populates="account", cascade="all, delete-orphan"
    )
    state: Mapped[Optional["DriveState"]] = relationship(
        back_populates="account", cascade="all, delete-orphan", uselist=False
    )
    files: Mapped[list["File"]] = relationship(
        back_populates="account", cascade="all, delete-orphan"
    )


class DriveChannel(Base):
    """Google Drive webhook channel."""

    __tablename__ = "drive_channels"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, server_default="uuid_generate_v4()"
    )
    account_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("drive_accounts.id", ondelete="CASCADE"), nullable=False
    )
    channel_id: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    resource_id: Mapped[str] = mapped_column(String, nullable=False)
    token: Mapped[str] = mapped_column(String, nullable=False)
    expiration: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default="NOW()", nullable=False
    )

    # Relationships
    account: Mapped["DriveAccount"] = relationship(back_populates="channels")


class DriveState(Base):
    """Sync state for a Google Drive account."""

    __tablename__ = "drive_state"

    account_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("drive_accounts.id", ondelete="CASCADE"),
        primary_key=True,
    )
    start_page_token: Mapped[str] = mapped_column(String, nullable=False)
    last_page_token: Mapped[str] = mapped_column(String, nullable=False)
    last_sync_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default="NOW()", nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default="NOW()", nullable=False
    )

    # Relationships
    account: Mapped["DriveAccount"] = relationship(back_populates="state")


class File(Base):
    """Indexed file from any source (Drive, Notion, Kiwify)."""

    __tablename__ = "files"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, server_default="uuid_generate_v4()"
    )
    account_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("drive_accounts.id", ondelete="CASCADE"), nullable=True
    )
    source_type: Mapped[str] = mapped_column(
        String, nullable=False, server_default="drive"  # drive | notion | kiwify | asaas
    )
    source_id: Mapped[Optional[str]] = mapped_column(
        String, nullable=True  # Notion page ID, Kiwify product/sale ID
    )
    file_id: Mapped[str] = mapped_column(String, nullable=False)  # Source-specific file ID
    name: Mapped[str] = mapped_column(String, nullable=False)
    path: Mapped[str] = mapped_column(String, nullable=False)
    mime_type: Mapped[str] = mapped_column(String, nullable=False)
    modified_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    content_hash: Mapped[Optional[str]] = mapped_column(String)
    owners: Mapped[list[str]] = mapped_column(ARRAY(Text), default=list)
    size_bytes: Mapped[Optional[int]] = mapped_column(BigInteger)
    is_oversized: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    trashed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    extraction_error: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default="NOW()", nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default="NOW()", nullable=False
    )

    # Relationships
    account: Mapped["DriveAccount"] = relationship(back_populates="files")
    chunks: Mapped[list["Chunk"]] = relationship(
        back_populates="file", cascade="all, delete-orphan"
    )

    __table_args__ = (
        # Unique constraint on account + file_id
        {"sqlite_autoincrement": True},
    )


class Chunk(Base):
    """Text chunk with embedding."""

    __tablename__ = "chunks"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, server_default="uuid_generate_v4()"
    )
    file_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("files.id", ondelete="CASCADE"), nullable=False
    )
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    start_offset: Mapped[Optional[int]] = mapped_column(Integer)
    end_offset: Mapped[Optional[int]] = mapped_column(Integer)
    heading: Mapped[Optional[str]] = mapped_column(Text)
    content_hash: Mapped[str] = mapped_column(String, nullable=False)
    embedding: Mapped[Optional[list[float]]] = mapped_column(Vector(768))  # Gemini MRL
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default="NOW()", nullable=False
    )

    # Relationships
    file: Mapped["File"] = relationship(back_populates="chunks")

    __table_args__ = (
        # Unique constraint on file + chunk_index
        {"sqlite_autoincrement": True},
    )
