"""Content extraction module."""

from src.services.extraction.docx import DocxExtractor
from src.services.extraction.google import (
    GoogleDocsExtractor,
    GoogleSheetsExtractor,
    GoogleSlidesExtractor,
)
from src.services.extraction.pdf import PDFExtractor
from src.services.extraction.pptx import PptxExtractor

# MIME type to extractor mapping
EXTRACTORS = {
    # PDF
    "application/pdf": PDFExtractor,
    # Office formats
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": DocxExtractor,
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": PptxExtractor,
    # Google Workspace (exported as text via Drive API)
    "application/vnd.google-apps.document": GoogleDocsExtractor,
    "application/vnd.google-apps.spreadsheet": GoogleSheetsExtractor,
    "application/vnd.google-apps.presentation": GoogleSlidesExtractor,
    # Plain text
    "text/plain": GoogleDocsExtractor,  # Same handler works
    "text/markdown": GoogleDocsExtractor,
    "text/html": GoogleDocsExtractor,
}


def get_extractor(mime_type: str):
    """Get extractor class for a MIME type."""
    extractor_class = EXTRACTORS.get(mime_type)
    if extractor_class:
        return extractor_class()
    return None


def extract_content(content: bytes, mime_type: str) -> str:
    """
    Extract text content from file bytes.

    Returns Markdown-formatted text or empty string if unsupported.
    """
    extractor = get_extractor(mime_type)
    if extractor:
        return extractor.extract(content)
    return ""


__all__ = [
    "DocxExtractor",
    "GoogleDocsExtractor",
    "GoogleSheetsExtractor",
    "GoogleSlidesExtractor",
    "PDFExtractor",
    "PptxExtractor",
    "EXTRACTORS",
    "extract_content",
    "get_extractor",
]
