"""Semantic chunking service with configurable overlap."""

import re
from dataclasses import dataclass
from typing import Iterator

from src.config import get_settings
from src.utils.hash import md5_hash
from src.utils.logging import get_logger

logger = get_logger(__name__)


@dataclass
class Chunk:
    """A text chunk with metadata."""

    index: int
    content: str
    start_offset: int
    end_offset: int
    heading: str | None
    content_hash: str


class ChunkingService:
    """
    Semantic chunking with heading preservation.

    Uses recursive splitting: sections → paragraphs → sentences.
    """

    def __init__(
        self,
        chunk_size: int | None = None,
        chunk_overlap: int | None = None,
    ) -> None:
        """Initialize chunking service."""
        settings = get_settings()
        self.chunk_size = chunk_size or settings.chunk_size
        self.chunk_overlap = chunk_overlap or settings.chunk_overlap

        # Heading patterns (Markdown)
        self.heading_pattern = re.compile(r"^(#{1,6})\s+(.+)$", re.MULTILINE)

    def chunk_text(self, text: str) -> list[Chunk]:
        """
        Split text into semantically meaningful chunks.

        Strategy:
        1. Split by headings to preserve document structure
        2. Split large sections by paragraphs
        3. Split large paragraphs by sentences
        4. Apply overlap for context preservation
        """
        if not text.strip():
            return []

        chunks = []
        current_heading = None
        current_offset = 0

        # Split by headings first
        sections = self._split_by_headings(text)

        for section_heading, section_text, section_start in sections:
            if section_heading:
                current_heading = section_heading

            # Chunk the section content
            section_chunks = self._chunk_section(
                section_text,
                base_offset=section_start,
                heading=current_heading,
                start_index=len(chunks),
            )
            chunks.extend(section_chunks)

        logger.debug(
            "Chunked text",
            total_chars=len(text),
            num_chunks=len(chunks),
            avg_chunk_size=len(text) // max(len(chunks), 1),
        )

        return chunks

    def _split_by_headings(self, text: str) -> list[tuple[str | None, str, int]]:
        """
        Split text by Markdown headings.

        Returns list of (heading, content, start_offset).
        """
        sections = []
        last_end = 0
        last_heading = None

        for match in self.heading_pattern.finditer(text):
            # Content before this heading
            if match.start() > last_end:
                content = text[last_end:match.start()].strip()
                if content:
                    sections.append((last_heading, content, last_end))

            last_heading = match.group(2).strip()
            last_end = match.end()

        # Remaining content after last heading
        if last_end < len(text):
            content = text[last_end:].strip()
            if content:
                sections.append((last_heading, content, last_end))

        # If no headings found, return entire text
        if not sections:
            sections.append((None, text.strip(), 0))

        return sections

    def _chunk_section(
        self,
        text: str,
        base_offset: int,
        heading: str | None,
        start_index: int,
    ) -> list[Chunk]:
        """Chunk a section of text."""
        if len(text) <= self.chunk_size:
            return [
                Chunk(
                    index=start_index,
                    content=text,
                    start_offset=base_offset,
                    end_offset=base_offset + len(text),
                    heading=heading,
                    content_hash=md5_hash(text),
                )
            ]

        chunks = []
        paragraphs = self._split_paragraphs(text)

        current_chunk = ""
        current_start = base_offset
        chunk_index = start_index

        for para, para_offset in paragraphs:
            # If adding this paragraph exceeds limit, finalize current chunk
            if current_chunk and len(current_chunk) + len(para) + 2 > self.chunk_size:
                chunks.append(
                    Chunk(
                        index=chunk_index,
                        content=current_chunk.strip(),
                        start_offset=current_start,
                        end_offset=current_start + len(current_chunk),
                        heading=heading,
                        content_hash=md5_hash(current_chunk.strip()),
                    )
                )
                chunk_index += 1

                # Apply overlap: keep last portion of current chunk
                overlap_text = self._get_overlap(current_chunk)
                current_chunk = overlap_text + "\n\n" + para if overlap_text else para
                current_start = base_offset + para_offset - len(overlap_text)
            else:
                if current_chunk:
                    current_chunk += "\n\n" + para
                else:
                    current_chunk = para
                    current_start = base_offset + para_offset

        # Final chunk
        if current_chunk.strip():
            chunks.append(
                Chunk(
                    index=chunk_index,
                    content=current_chunk.strip(),
                    start_offset=current_start,
                    end_offset=current_start + len(current_chunk),
                    heading=heading,
                    content_hash=md5_hash(current_chunk.strip()),
                )
            )

        return chunks

    def _split_paragraphs(self, text: str) -> list[tuple[str, int]]:
        """Split text into paragraphs with offsets."""
        paragraphs = []
        current_offset = 0

        for para in text.split("\n\n"):
            para = para.strip()
            if para:
                # Find actual offset in original text
                idx = text.find(para, current_offset)
                if idx >= 0:
                    paragraphs.append((para, idx))
                    current_offset = idx + len(para)

        return paragraphs

    def _get_overlap(self, text: str) -> str:
        """Get overlap portion from end of text."""
        if len(text) <= self.chunk_overlap:
            return text

        # Try to break at sentence boundary
        overlap_region = text[-self.chunk_overlap * 2:]
        sentences = re.split(r'(?<=[.!?])\s+', overlap_region)

        if len(sentences) > 1:
            # Take last complete sentence(s) up to overlap size
            overlap = ""
            for sent in reversed(sentences):
                if len(overlap) + len(sent) <= self.chunk_overlap:
                    overlap = sent + " " + overlap
                else:
                    break
            return overlap.strip()

        # Fallback: just take last N characters
        return text[-self.chunk_overlap:]
