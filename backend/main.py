"""
Mr. Clarke's Automated Briefing Generator — FastAPI Backend

Adapted from:
  - pdf-to-slides-ai-generator: FastAPI app structure, endpoints, file upload handling
  - presenton: API routing patterns, static file serving

Provides endpoints to upload documents, generate themed presentations, and download them.
"""

import os
import sys
import shutil
import uuid
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Add project root to path
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

from modules.document_loader import DocumentLoader
from modules.chunker import TextChunker
from modules.rag_engine import RAGEngine
from modules.slide_generator import SlideGenerator
from modules.pptx_builder import PptxBuilder
from modules.citation_builder import CitationBuilder

load_dotenv(os.path.join(PROJECT_ROOT, ".env"))

# ── App Configuration ─────────────────────────────────────────────
UPLOAD_DIR = os.path.join(PROJECT_ROOT, "data")
VECTOR_DIR = os.path.join(PROJECT_ROOT, "vector_store")
SLIDES_DIR = os.path.join(PROJECT_ROOT, "slides")
FRONTEND_DIR = os.path.join(PROJECT_ROOT, "frontend")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(VECTOR_DIR, exist_ok=True)
os.makedirs(SLIDES_DIR, exist_ok=True)

# ── FastAPI App ───────────────────────────────────────────────────
app = FastAPI(
    title="Mr. Clarke's Automated Briefing Generator",
    description="AI-powered document to presentation system — Hawkins Lab Edition",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve frontend static files
app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

# ── Shared State ──────────────────────────────────────────────────
# In a production app these would be in a database/cache.
# For the hackathon we keep them in memory.
document_store: dict = {
    "files": [],       # List of uploaded file metadata
    "full_text": "",   # Combined extracted text
    "chunks": [],      # Text chunks
    "indexed": False,  # Whether FAISS index is built
    "last_slide_data": None,  # Last generated slide JSON for preview
}

rag_engine = RAGEngine()
citation_builder = CitationBuilder()


def _keyword_retrieval(query: str, chunks: list, k: int = 5) -> list:
    """
    Simple keyword-based retrieval fallback when FAISS/embeddings aren't available.
    Scores chunks by keyword overlap with the query.
    """
    if not chunks:
        return [document_store.get("full_text", "")[:3000]]

    query_words = set(query.lower().split())
    scored = []
    for chunk in chunks:
        chunk_words = set(chunk.lower().split())
        overlap = len(query_words & chunk_words)
        scored.append((overlap, chunk))

    scored.sort(key=lambda x: x[0], reverse=True)
    results = [chunk for _, chunk in scored[:k]]
    return results if results else chunks[:k]


# ── API Endpoints ─────────────────────────────────────────────────

@app.get("/")
async def serve_frontend():
    """Serve the main frontend page."""
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return JSONResponse({"message": "Mr. Clarke's Briefing Generator API is running"})


@app.post("/upload-documents")
async def upload_documents(files: list[UploadFile] = File(...)):
    """
    Upload one or more documents (PDF or TXT).
    Extracts text, chunks it, and builds the FAISS vector index.

    Adapted from pdf-to-slides create_presentation_from_pdf() endpoint.
    """
    loader = DocumentLoader()
    chunker = TextChunker(chunk_size=500, chunk_overlap=50)
    all_text_parts = []
    uploaded_info = []

    for file in files:
        # Validate file type
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in {".pdf", ".txt"}:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {ext}. Only PDF and TXT are supported.",
            )

        # Save file
        file_id = str(uuid.uuid4())[:8]
        save_name = f"{file_id}_{file.filename}"
        save_path = os.path.join(UPLOAD_DIR, save_name)

        content = await file.read()
        with open(save_path, "wb") as f:
            f.write(content)

        # Extract text
        text = loader.load_from_bytes(content, file.filename)
        all_text_parts.append(text)

        # Track source
        citation_builder.add_source(file.filename, f"Uploaded document ({len(text)} chars)")
        uploaded_info.append({
            "filename": file.filename,
            "saved_as": save_name,
            "text_length": len(text),
        })

    # Combine all text
    full_text = "\n\n".join(all_text_parts)
    document_store["full_text"] = full_text
    document_store["files"] = uploaded_info

    # Chunk the text
    chunks = chunker.chunk_text(full_text)
    document_store["chunks"] = chunks

    # Build FAISS index
    try:
        rag_engine.add_documents(chunks)
        document_store["indexed"] = True
        rag_engine.save_index(VECTOR_DIR)
    except Exception as e:
        document_store["indexed"] = False
        # Continue without RAG — will use full text fallback
        print(f"Warning: Could not build vector index: {e}")

    return JSONResponse({
        "status": "success",
        "message": f"Uploaded {len(files)} document(s). Extracted {len(chunks)} chunks.",
        "documents": uploaded_info,
        "chunks_count": len(chunks),
        "index_built": document_store["indexed"],
    })


@app.post("/generate-presentation")
async def generate_presentation(
    topic: str = Form(...),
    num_slides: int = Form(6),
):
    """
    Generate a Stranger Things themed presentation from uploaded documents.

    Pipeline:
    1. Retrieve relevant chunks via RAG (or use full text)
    2. Send to LLM for slide outline generation
    3. Build themed PPTX with python-pptx
    4. Return download info

    Adapted from pdf-to-slides create_presentation() and
    slide-deck-ai SlideDeckAI.generate() flow.
    """
    if not document_store["full_text"]:
        raise HTTPException(
            status_code=400,
            detail="No documents uploaded yet. Please upload documents first.",
        )

    # Step 1: Retrieve relevant context
    if document_store["indexed"]:
        try:
            context = rag_engine.query(topic, k=5)
        except Exception:
            context = _keyword_retrieval(topic, document_store["chunks"], k=5)
    else:
        # Fallback: keyword-based retrieval from stored chunks
        context = _keyword_retrieval(topic, document_store["chunks"], k=5)

    # Step 2: Generate slide outline via LLM
    generator = SlideGenerator()
    try:
        slide_data = generator.generate_outline(topic, context, num_slides)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate presentation outline: {str(e)}",
        )

    # Step 3: Add citation slide
    citation_slide = citation_builder.build_citation_slide()
    if "slides" in slide_data:
        slide_data["slides"].append(citation_slide)

    # Store for preview
    document_store["last_slide_data"] = slide_data

    # Step 4: Build themed PPTX
    builder = PptxBuilder(output_dir=SLIDES_DIR)
    try:
        filepath = builder.build(slide_data)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to build presentation: {str(e)}",
        )

    filename = os.path.basename(filepath)

    return JSONResponse({
        "status": "success",
        "message": "Briefing generated successfully!",
        "filename": filename,
        "download_url": f"/download-presentation/{filename}",
        "slides_count": len(slide_data.get("slides", [])),
        "title": slide_data.get("title", "Classified Briefing"),
    })


@app.get("/download-presentation/{filename}")
async def download_presentation(filename: str):
    """
    Download a generated presentation file.
    Adapted from pdf-to-slides download_presentation() endpoint.
    """
    filepath = os.path.join(SLIDES_DIR, filename)

    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Presentation file not found.")

    return FileResponse(
        path=filepath,
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
    )


@app.get("/api/status")
async def api_status():
    """Health check and current state."""
    return {
        "status": "online",
        "project": "Mr. Clarke's Automated Briefing Generator",
        "documents_loaded": len(document_store["files"]),
        "chunks_indexed": len(document_store["chunks"]),
        "index_ready": document_store["indexed"],
    }


@app.get("/api/preview-slides")
async def preview_slides():
    """Return the last generated slide data for in-browser preview."""
    data = document_store.get("last_slide_data")
    if not data:
        raise HTTPException(status_code=404, detail="No presentation generated yet.")
    return data
