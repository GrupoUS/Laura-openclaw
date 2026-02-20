"""Content extraction for PDF files using PyMuPDF4LLM."""

import pymupdf4llm
import fitz  # PyMuPDF

from src.utils.logging import get_logger

logger = get_logger(__name__)


class PDFExtractor:
    """Extract text content from PDF files as Markdown."""

    def extract(self, content: bytes) -> str:
        """
        Extract text from PDF bytes.

        Returns Markdown-formatted text preserving structure.
        """
        try:
            # Open PDF from bytes
            doc = fitz.open(stream=content, filetype="pdf")

            # Extract as Markdown using pymupdf4llm
            md_text = pymupdf4llm.to_markdown(doc)

            # Save page count before closing
            page_count = len(doc)
            doc.close()

            logger.debug("Extracted PDF", pages=page_count, chars=len(md_text))
            return md_text

        except Exception as e:
            logger.error("PDF extraction failed", error=str(e))
            raise

    def extract_with_metadata(self, content: bytes) -> dict:
        """Extract text with page metadata."""
        doc = fitz.open(stream=content, filetype="pdf")

        pages = []
        for page_num, page in enumerate(doc):
            text = page.get_text("text")
            pages.append({
                "page_number": page_num + 1,
                "content": text.strip(),
            })

        # Also get full Markdown
        md_text = pymupdf4llm.to_markdown(doc)

        doc.close()

        return {
            "markdown": md_text,
            "pages": pages,
            "page_count": len(pages),
        }
