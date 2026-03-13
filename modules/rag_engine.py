"""
RAG Engine Module
New module for the briefing generator.

Uses FAISS for vector storage with Ollama embeddings
to provide retrieval-augmented generation capabilities.
Falls back to keyword-based retrieval if embeddings are unavailable.
"""

import os
import numpy as np
import google.generativeai as genai
from typing import List, Optional

try:
    import faiss
except ImportError:
    faiss = None


OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
EMBEDDING_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "llama3")


class RAGEngine:
    """
    Retrieval-Augmented Generation engine using FAISS and Ollama embeddings.
    Stores document chunks as embeddings and retrieves relevant context
    for slide generation. Falls back to keyword matching if embeddings fail.
    """

    def __init__(self, api_key: str = None):
        """
        Initialize the RAG engine.
        """
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY")
        self.chunks: List[str] = []
        self.index = None
        self._embeddings_cache: Optional[np.ndarray] = None
        self._use_embeddings = False
        
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self._use_embeddings = True

    def _get_embedding(self, text: str) -> List[float]:
        """
        Get embedding vector using Google Gemini API.
        """
        if not self.api_key:
            return []
            
        result = genai.embed_content(
            model="models/embedding-001",
            content=text,
            task_type="retrieval_document"
        )
        return result.get("embedding", [])

    def add_documents(self, chunks: List[str]):
        """
        Store document chunks. Attempts to build FAISS index with embeddings,
        falls back to storing chunks for keyword retrieval.

        Args:
            chunks: List of text chunks to index.
        """
        if not chunks:
            return

        self.chunks = chunks

        # Try to build FAISS index with embeddings
        if faiss:
            try:
                embeddings = []
                for chunk in chunks:
                    emb = self._get_embedding(chunk)
                    if emb:
                        embeddings.append(emb)

                if embeddings and len(embeddings) == len(chunks):
                    embeddings_np = np.array(embeddings, dtype="float32")
                    self._embeddings_cache = embeddings_np
                    dim = embeddings_np.shape[1]
                    self.index = faiss.IndexFlatL2(dim)
                    self.index.add(embeddings_np)
                    self._use_embeddings = True
                    print(f"[RAGEngine] FAISS index built with {len(chunks)} chunks (dim={dim})")
                    return
            except Exception as e:
                print(f"[RAGEngine] Embedding failed, using keyword retrieval: {e}")

        # Fallback: just store chunks for keyword retrieval
        self._use_embeddings = False
        print(f"[RAGEngine] Stored {len(chunks)} chunks for keyword retrieval")

    def query(self, question: str, k: int = 5) -> List[str]:
        """
        Retrieve the most relevant document chunks for a question.

        Args:
            question: The user's query or topic.
            k: Number of top results to return.

        Returns:
            List of relevant text chunks.
        """
        if not self.chunks:
            return []

        k = min(k, len(self.chunks))

        # Try FAISS search if available
        if self._use_embeddings and self.index is not None:
            try:
                query_emb = self._get_embedding(question)
                query_np = np.array([query_emb], dtype="float32")
                distances, indices = self.index.search(query_np, k)

                results = []
                for idx in indices[0]:
                    if 0 <= idx < len(self.chunks):
                        results.append(self.chunks[idx])
                return results
            except Exception:
                pass  # Fall through to keyword retrieval

        # Keyword-based retrieval fallback
        return self._keyword_search(question, k)

    def _keyword_search(self, query: str, k: int) -> List[str]:
        """Simple keyword overlap scoring for retrieval."""
        query_words = set(query.lower().split())
        scored = []
        for chunk in self.chunks:
            chunk_words = set(chunk.lower().split())
            overlap = len(query_words & chunk_words)
            scored.append((overlap, chunk))

        scored.sort(key=lambda x: x[0], reverse=True)
        return [chunk for _, chunk in scored[:k]]

    def save_index(self, directory: str):
        """Save FAISS index and chunks to disk."""
        os.makedirs(directory, exist_ok=True)

        if faiss and self.index is not None:
            faiss.write_index(self.index, os.path.join(directory, "index.faiss"))

        with open(os.path.join(directory, "chunks.txt"), "w", encoding="utf-8") as f:
            for chunk in self.chunks:
                f.write(chunk.replace("\n", "\\n") + "\n---CHUNK_SEPARATOR---\n")

    def load_index(self, directory: str):
        """Load FAISS index and chunks from disk."""
        index_path = os.path.join(directory, "index.faiss")
        chunks_path = os.path.join(directory, "chunks.txt")

        if faiss and os.path.exists(index_path):
            self.index = faiss.read_index(index_path)
            self._use_embeddings = True

        if os.path.exists(chunks_path):
            with open(chunks_path, "r", encoding="utf-8") as f:
                content = f.read()
            raw_chunks = content.split("---CHUNK_SEPARATOR---")
            self.chunks = [
                c.strip().replace("\\n", "\n") for c in raw_chunks if c.strip()
            ]
