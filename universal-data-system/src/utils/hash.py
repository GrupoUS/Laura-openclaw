"""Hashing utilities for content deduplication."""

import hashlib


def md5_hash(content: str | bytes) -> str:
    """Calculate MD5 hash of content."""
    if isinstance(content, str):
        content = content.encode("utf-8")
    return hashlib.md5(content).hexdigest()


def stable_chunk_id(file_id: str, chunk_index: int) -> str:
    """Generate stable ID for a chunk based on file and index."""
    return md5_hash(f"{file_id}:{chunk_index}")
