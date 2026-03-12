"""
Text Chunker Module
Adapted from:
  - presenton: ScoreBasedChunker (heading-based chunking with scoring)

Splits extracted document text into chunks suitable for embedding and RAG retrieval.
Uses recursive character splitting for optimal chunk sizes.
"""

from typing import List


class TextChunker:
    """
    Splits text into overlapping chunks for RAG pipeline.
    Combines ideas from presenton's ScoreBasedChunker with
    recursive character text splitting for better RAG results.
    """

    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50):
        """
        Args:
            chunk_size: Maximum characters per chunk.
            chunk_overlap: Overlap between consecutive chunks.
        """
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_text(self, text: str) -> List[str]:
        """
        Split text into overlapping chunks.

        Uses a recursive approach: tries to split on paragraph breaks first,
        then sentences, then words, falling back to character-level splitting.

        Args:
            text: The full document text.

        Returns:
            List of text chunks.
        """
        if not text or not text.strip():
            return []

        # Try splitting by progressively smaller separators
        separators = ["\n\n", "\n", ". ", " ", ""]
        return self._recursive_split(text, separators)

    def _recursive_split(self, text: str, separators: List[str]) -> List[str]:
        """
        Recursively split text using a hierarchy of separators.
        Inspired by LangChain's RecursiveCharacterTextSplitter approach.
        """
        if len(text) <= self.chunk_size:
            return [text.strip()] if text.strip() else []

        separator = separators[0]
        remaining_separators = separators[1:] if len(separators) > 1 else [""]

        if separator == "":
            # Character-level fallback
            chunks = []
            for i in range(0, len(text), self.chunk_size - self.chunk_overlap):
                chunk = text[i : i + self.chunk_size].strip()
                if chunk:
                    chunks.append(chunk)
            return chunks

        parts = text.split(separator)
        chunks = []
        current_chunk = ""

        for part in parts:
            test_chunk = (
                current_chunk + separator + part if current_chunk else part
            )

            if len(test_chunk) <= self.chunk_size:
                current_chunk = test_chunk
            else:
                if current_chunk.strip():
                    chunks.append(current_chunk.strip())

                if len(part) > self.chunk_size:
                    # Part is too large — split with next separator
                    sub_chunks = self._recursive_split(part, remaining_separators)
                    chunks.extend(sub_chunks)
                    current_chunk = ""
                else:
                    # Start overlap from end of previous chunk
                    if chunks:
                        overlap_text = chunks[-1][-self.chunk_overlap :]
                        current_chunk = overlap_text + separator + part
                    else:
                        current_chunk = part

        if current_chunk.strip():
            chunks.append(current_chunk.strip())

        return chunks

    def extract_headings(self, text: str) -> List[str]:
        """
        Extract markdown headings from text.
        Reused from presenton ScoreBasedChunker.extract_headings().

        Args:
            text: Document text with potential markdown headings.

        Returns:
            List of heading strings.
        """
        headings = []
        for line in text.split("\n"):
            line = line.strip()
            if line.startswith("#"):
                headings.append(line)
        return headings
