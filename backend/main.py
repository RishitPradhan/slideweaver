"""
Mr. Clarke's Automated Briefing Generator — FastAPI Backend

Provides endpoints to upload documents, generate themed presentations, and download them.
Now supports: Google Gemini LLM, AI images, dynamic themes, DOCX/PPTX import,
tone/verbosity/language controls.
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

# Load environment variables before importing any custom modules
load_dotenv(os.path.join(PROJECT_ROOT, ".env"))

from modules.document_loader import DocumentLoader
from modules.chunker import TextChunker
from modules.rag_engine import RAGEngine
from modules.slide_generator import SlideGenerator
from modules.pptx_builder import PptxBuilder
from modules.citation_builder import CitationBuilder
from modules.image_generator import process_slides_images
from modules.theme_engine import THEME_PRESETS, generate_color_palette

# ── App Configuration ─────────────────────────────────────────────
UPLOAD_DIR = os.path.join(PROJECT_ROOT, "data")
VECTOR_DIR = os.path.join(PROJECT_ROOT, "vector_store")
SLIDES_DIR = os.path.join(PROJECT_ROOT, "slides")
IMAGES_DIR = os.path.join(SLIDES_DIR, "images")
FRONTEND_DIR = os.path.join(PROJECT_ROOT, "frontend")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(VECTOR_DIR, exist_ok=True)
os.makedirs(SLIDES_DIR, exist_ok=True)
os.makedirs(IMAGES_DIR, exist_ok=True)

# ── FastAPI App ───────────────────────────────────────────────────
app = FastAPI(
    title="Mr. Clarke's Automated Briefing Generator",
    description="AI-powered document to presentation system",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Serve frontend static files
app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

# Serve generated images for preview
app.mount("/images", StaticFiles(directory=IMAGES_DIR), name="images")

# ── Shared State ──────────────────────────────────────────────────
document_store: dict = {
    "files": [],
    "full_text": "",
    "chunks": [],
    "indexed": False,
    "last_slide_data": None,
}

rag_engine = RAGEngine()
citation_builder = CitationBuilder()


def _keyword_retrieval(query: str, chunks: list, k: int = 5) -> list:
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
    index_path = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return JSONResponse({"message": "Slideweaver API is running"})


@app.post("/upload-documents")
async def upload_documents(files: list[UploadFile] = File(...)):
    """
    Upload documents (PDF, TXT, DOCX, PPTX).
    Extracts text, chunks it, and builds the FAISS vector index.
    """
    loader = DocumentLoader()
    chunker = TextChunker(chunk_size=500, chunk_overlap=50)
    all_text_parts = []
    uploaded_info = []

    SUPPORTED = {".pdf", ".txt", ".docx", ".pptx"}

    for file in files:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in SUPPORTED:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {ext}. Supported: {', '.join(SUPPORTED)}",
            )

        file_id = str(uuid.uuid4())[:8]
        save_name = f"{file_id}_{file.filename}"
        save_path = os.path.join(UPLOAD_DIR, save_name)

        content = await file.read()
        with open(save_path, "wb") as f:
            f.write(content)

        text = loader.load_from_bytes(content, file.filename)
        all_text_parts.append(text)

        citation_builder.add_source(file.filename, f"Uploaded document ({len(text)} chars)")
        uploaded_info.append({
            "filename": file.filename,
            "saved_as": save_name,
            "text_length": len(text),
        })

    full_text = "\n\n".join(all_text_parts)
    document_store["full_text"] = full_text
    document_store["files"] = uploaded_info

    chunks = chunker.chunk_text(full_text)
    document_store["chunks"] = chunks

    try:
        rag_engine.add_documents(chunks)
        document_store["indexed"] = True
        rag_engine.save_index(VECTOR_DIR)
    except Exception as e:
        document_store["indexed"] = False
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
    tone: str = Form("professional"),
    verbosity: str = Form("standard"),
    language: str = Form("English"),
    template: str = Form("hawkins_dark"),
    include_images: str = Form("false"),
    include_toc: str = Form("false"),
):
    """
    Generate a themed presentation with full customization options.
    """
    # Parse string booleans from FormData (JavaScript sends "true"/"false" as strings)
    images_enabled = include_images.lower() in ("true", "1", "yes", "on")
    toc_enabled = include_toc.lower() in ("true", "1", "yes", "on")

    print(f"[generate-presentation] include_images={include_images!r} -> {images_enabled}")
    print(f"[generate-presentation] include_toc={include_toc!r} -> {toc_enabled}")

    if not document_store["full_text"]:
        raise HTTPException(
            status_code=400,
            detail="No documents uploaded yet. Please upload documents first.",
        )

    print(f"\n{'='*60}")
    print(f"[PIPELINE] Starting presentation generation")
    print(f"[PIPELINE] Topic: {topic}")
    print(f"[PIPELINE] Slides: {num_slides}, Images: {images_enabled}, TOC: {toc_enabled}")
    print(f"{'='*60}")

    # Step 1: Retrieve relevant context
    print("\n[STEP 1] Retrieving relevant context...")
    if document_store["indexed"]:
        try:
            context = rag_engine.query(topic, k=5)
        except Exception:
            context = _keyword_retrieval(topic, document_store["chunks"], k=5)
    else:
        context = _keyword_retrieval(topic, document_store["chunks"], k=5)
    print(f"[STEP 1] Retrieved {len(context)} context chunks")

    # Step 2: Generate slide outline via LLM
    print("\n[STEP 2] Generating slide outline via LLM...")

    # Adjust slide count to ensure total presentation matches user's request
    # Total = Title(1) + Citation(1) + (1 if TOC) + Content Slides
    num_content_slides = num_slides - 2 - (1 if toc_enabled else 0)
    num_content_slides = max(1, num_content_slides)

    generator = SlideGenerator()
    try:
        slide_data = generator.generate_outline(
            topic, context, num_content_slides,
            tone=tone, verbosity=verbosity, language=language,
            include_images=images_enabled, include_toc=toc_enabled,
        )
    except Exception as e:
        print(f"[STEP 2] FAILED: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate presentation outline: {str(e)}",
        )

    slides = slide_data.get("slides", [])
    print(f"[STEP 2] Generated {len(slides)} slides:")
    for i, s in enumerate(slides):
        has_img = "__image_prompt__" in s
        print(f"  [{i}] type={s.get('type')}, title={s.get('title', '')[:40]}, has_image_prompt={has_img}")

    # Step 3: Process images
    if images_enabled and "slides" in slide_data:
        print("\n[STEP 3] Processing images...")

        # Auto-inject __image_prompt__ for slides that don't have one
        image_count = sum(1 for s in slide_data["slides"] if "__image_prompt__" in s)
        print(f"[STEP 3] LLM included {image_count} image prompts")

        if image_count == 0:
            print("[STEP 3] Auto-injecting image prompts into content slides...")
            inject_count = 0
            for s in slide_data["slides"]:
                if s.get("type") in ("content", "bullet_points") and "__image_prompt__" not in s:
                    title = s.get("title", "")
                    # Build a specific search query from slide content
                    bullets = s.get("bullet_points", [])
                    if bullets:
                        keywords = " ".join([" ".join(str(b).split()[:3]) for b in bullets[:2]])
                    else:
                        keywords = s.get("content", "")[:60]
                    s["__image_prompt__"] = f"{title} {keywords}".strip()[:100]
                    inject_count += 1
                    print(f"  -> Injected prompt for: {title}")
            print(f"[STEP 3] Injected {inject_count} image prompts")
        else:
            # Even when LLM provided some, inject into remaining content slides
            extra = 0
            for s in slide_data["slides"]:
                if s.get("type") in ("content", "bullet_points") and "__image_prompt__" not in s:
                    title = s.get("title", "")
                    bullets = s.get("bullet_points", [])
                    if bullets:
                        keywords = " ".join([" ".join(str(b).split()[:3]) for b in bullets[:2]])
                    else:
                        keywords = s.get("content", "")[:60]
                    s["__image_prompt__"] = f"{title} {keywords}".strip()[:100]
                    extra += 1
            if extra:
                print(f"[STEP 3] Auto-filled {extra} additional image prompts")

        try:
            slide_data["slides"] = process_slides_images(
                slide_data["slides"], output_dir=IMAGES_DIR
            )
        except Exception as e:
            print(f"[STEP 3] WARNING: Image generation failed: {e}")
            import traceback
            traceback.print_exc()

        # Log final state
        for i, s in enumerate(slide_data["slides"]):
            if "__image_path__" in s:
                print(f"  [{i}] IMAGE: {s['__image_path__']}")
    else:
        print("\n[STEP 3] Skipped (images_enabled={images_enabled})")

    # Step 4: Add citation slide
    print("\n[STEP 4] Adding citation slide...")
    citation_slide = citation_builder.build_citation_slide()
    if "slides" in slide_data:
        slide_data["slides"].append(citation_slide)

    # Ensure final slide count strictly matches requested num_slides
    current_count = len(slide_data.get("slides", []))
    if current_count > num_slides:
        print(f"[PIPELINE] Pruning slides to match target: {current_count} -> {num_slides}")
        diff = current_count - num_slides
        # Remove extra slides from the end of the content section (before citation)
        for _ in range(diff):
            if len(slide_data["slides"]) > 2:  # Keep at least title and citation
                slide_data["slides"].pop(-2)
    elif current_count < num_slides:
        print(f"[PIPELINE] WARNING: Generated fewer slides than requested ({current_count} < {num_slides})")

    # Step 5: Build themed PPTX
    print("\n[STEP 5] Building themed PPTX...")

    # Fetch theme colors early to avoid NameError
    from modules.theme_engine import get_theme
    theme_colors = get_theme(template)

    # Store for preview
    slide_data["theme"] = template
    slide_data["theme_colors"] = theme_colors
    document_store["last_slide_data"] = slide_data
    print(f"[STEP 4] Stored {len(slide_data.get('slides', []))} slides for preview")

    builder = PptxBuilder(output_dir=SLIDES_DIR, theme_name=template)
    try:
        filepath = builder.build(slide_data)
    except Exception as e:
        print(f"[STEP 5] FAILED: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to build presentation: {str(e)}",
        )

    filename = os.path.basename(filepath)
    print(f"[STEP 5] PPTX saved: {filename}")
    print(f"{'='*60}")
    print(f"[PIPELINE] COMPLETE - {len(slide_data.get('slides', []))} slides")
    print(f"{'='*60}\n")

    return JSONResponse({
        "status": "success",
        "message": "Presentation generated successfully!",
        "filename": filename,
        "download_url": f"/download-presentation/{filename}",
        "slides_count": len(slide_data.get("slides", [])),
        "title": slide_data.get("title", "Presentation"),
        "theme": template,
        "theme_colors": theme_colors,
    })


@app.get("/download-presentation/{filename}")
async def download_presentation(filename: str):
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
    return {
        "status": "online",
        "project": "Slideweaver — Automated Briefing Generator",
        "version": "2.0.0",
        "documents_loaded": len(document_store["files"]),
        "chunks_indexed": len(document_store["chunks"]),
        "index_ready": document_store["indexed"],
        "gemini_available": bool(os.getenv("GOOGLE_API_KEY")),
        "features": [
            "gemini_llm", "multi_format_upload", "dynamic_themes",
            "image_generation", "tone_control", "verbosity_control",
            "language_support", "toc_slides",
        ],
    }


@app.get("/api/preview-slides")
async def preview_slides():
    import copy
    data = document_store.get("last_slide_data")
    if not data:
        raise HTTPException(status_code=404, detail="No presentation generated yet.")

    # Deep copy to avoid mutating stored data
    preview = copy.deepcopy(data)

    # Normalize image paths to just filenames for the frontend
    for slide in preview.get("slides", []):
        if "__image_path__" in slide:
            raw = slide["__image_path__"]
            # Extract just the filename from any path format
            filename = raw.replace("\\", "/").split("/")[-1]
            slide["__image_path__"] = filename

    return preview


@app.get("/api/themes")
async def list_themes():
    """List all available theme presets."""
    themes = []
    for key, theme in THEME_PRESETS.items():
        themes.append({
            "id": key,
            "name": theme["name"],
            "primary": theme["primary"],
            "background": theme["background"],
            "accent1": theme["accent1"],
        })
    themes.append({
        "id": "auto",
        "name": "Auto Generate",
        "primary": "random",
        "background": "random",
        "accent1": "random",
    })
    return {"themes": themes}


@app.post("/api/generate-theme")
async def generate_theme():
    """Generate a random color palette."""
    palette = generate_color_palette()
    return {"palette": palette}
