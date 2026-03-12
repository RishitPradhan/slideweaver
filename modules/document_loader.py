"""
Document Loader Module
Adapted from:
  - pdf-to-slides-ai-generator: PDFProcessor.extract_text_from_pdf() (PyPDF2-based extraction)
  - presenton: DocumentsLoader (multi-format loading with pdfplumber)

Handles PDF and TXT document ingestion for the briefing generator pipeline.
"""

import os
import tempfile
from typing import List
from PyPDF2 import PdfReader


class DocumentLoader:
    """
    Loads and extracts text from uploaded documents.
    Supports PDF and TXT file formats.
    """

    SUPPORTED_EXTENSIONS = {".pdf", ".txt"}

    def load_document(self, file_path: str) -> str:
        """
        Extract text content from a document file.

        Args:
            file_path: Path to the document file.

        Returns:
            Extracted text as a string.

        Raises:
            FileNotFoundError: If the file does not exist.
            ValueError: If the file type is not supported.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        ext = os.path.splitext(file_path)[1].lower()

        if ext not in self.SUPPORTED_EXTENSIONS:
            raise ValueError(
                f"Unsupported file type: {ext}. Supported: {self.SUPPORTED_EXTENSIONS}"
            )

        if ext == ".pdf":
            return self._extract_pdf(file_path)
        elif ext == ".txt":
            return self._extract_txt(file_path)

    def load_from_bytes(self, content: bytes, filename: str) -> str:
        """
        Extract text from file bytes (for uploaded files).

        Args:
            content: Raw file bytes.
            filename: Original filename to determine type.

        Returns:
            Extracted text as a string.
        """
        ext = os.path.splitext(filename)[1].lower()

        if ext == ".pdf":
            return self._extract_pdf_from_bytes(content)
        elif ext == ".txt":
            return content.decode("utf-8", errors="ignore")
        else:
            raise ValueError(f"Unsupported file type: {ext}")

    def _extract_pdf(self, file_path: str) -> str:
        """
        Extract text from a PDF file using PyPDF2.
        Reused from pdf-to-slides-ai-generator PDFProcessor.
        """
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text.strip()

    def _extract_pdf_from_bytes(self, content: bytes) -> str:
        """
        Extract text from PDF bytes by writing to a temp file.
        Adapted from pdf-to-slides-ai-generator PDFProcessor.extract_text_from_pdf().
        """
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        try:
            return self._extract_pdf(tmp_path)
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

    def _extract_txt(self, file_path: str) -> str:
        """Extract text from a plain text file."""
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read().strip()

    def load_multiple(self, file_paths: List[str]) -> str:
        """
        Load and concatenate text from multiple documents.
        Inspired by presenton DocumentsLoader.load_documents().

        Args:
            file_paths: List of document file paths.

        Returns:
            Combined text from all documents.
        """
        all_text = []
        for path in file_paths:
            text = self.load_document(path)
            if text:
                all_text.append(f"--- Document: {os.path.basename(path)} ---\n{text}")
        return "\n\n".join(all_text)
