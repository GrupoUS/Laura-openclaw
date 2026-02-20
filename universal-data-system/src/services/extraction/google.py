"""Content extraction for Google Workspace files.

Google Docs, Sheets, and Slides are exported as text via Drive API,
so this module handles the text that's already been exported.
"""

from src.utils.logging import get_logger

logger = get_logger(__name__)


class GoogleDocsExtractor:
    """Process exported Google Docs content (already text/plain)."""

    def extract(self, content: bytes) -> str:
        """
        Process Google Docs content.

        The Drive API exports Docs as plain text, so minimal processing needed.
        """
        try:
            text = content.decode("utf-8")
            # Clean up and normalize
            lines = [line.strip() for line in text.split("\n")]
            result = "\n".join(lines)

            logger.debug("Processed Google Doc", chars=len(result))
            return result

        except Exception as e:
            logger.error("Google Doc processing failed", error=str(e))
            raise


class GoogleSheetsExtractor:
    """Process exported Google Sheets content (CSV format)."""

    def extract(self, content: bytes) -> str:
        """
        Convert CSV export to Markdown table.
        """
        try:
            text = content.decode("utf-8")
            lines = text.strip().split("\n")

            if not lines:
                return ""

            # Convert CSV to Markdown table
            rows = []
            for i, line in enumerate(lines):
                # Simple CSV parsing (doesn't handle quoted commas)
                cells = [cell.strip().replace("|", "\\|") for cell in line.split(",")]
                rows.append("| " + " | ".join(cells) + " |")

                # Add header separator after first row
                if i == 0:
                    separator = "| " + " | ".join(["---"] * len(cells)) + " |"
                    rows.append(separator)

            result = "\n".join(rows)
            logger.debug("Processed Google Sheet", rows=len(lines), chars=len(result))
            return result

        except Exception as e:
            logger.error("Google Sheet processing failed", error=str(e))
            raise


class GoogleSlidesExtractor:
    """Process exported Google Slides content (plain text)."""

    def extract(self, content: bytes) -> str:
        """
        Process Google Slides plain text export.

        Adds structure markers for slide boundaries.
        """
        try:
            text = content.decode("utf-8")

            # Google exports slides with form feeds or specific markers
            # We'll add slide headers based on content patterns
            lines = text.split("\n")
            result_lines = []
            slide_num = 0

            for line in lines:
                stripped = line.strip()
                if stripped:
                    # Heuristic: longer non-empty line after empty might be title
                    if not result_lines or not result_lines[-1]:
                        slide_num += 1
                        result_lines.append(f"\n## Slide {slide_num}\n")
                    result_lines.append(stripped)
                else:
                    result_lines.append("")

            result = "\n".join(result_lines)
            logger.debug("Processed Google Slides", chars=len(result))
            return result

        except Exception as e:
            logger.error("Google Slides processing failed", error=str(e))
            raise
