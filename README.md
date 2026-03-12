# 🔴 Mr. Clarke's Automated Briefing Generator

> *"The Upside Down of documents... transformed into presentations."*  
> **Hawkins National Laboratory — AI Division**

An AI-powered system that reads documents (PDF or TXT) and automatically generates a fully formatted, animated presentation with a **Stranger Things / Hawkins Lab** retro theme.

![Theme: Stranger Things](https://img.shields.io/badge/Theme-Stranger%20Things-red?style=flat-square)
![Python 3.10+](https://img.shields.io/badge/Python-3.10+-blue?style=flat-square)
![FastAPI](https://img.shields.io/badge/Backend-FastAPI-green?style=flat-square)

---

## 📡 How Repositories Were Reused

This project unifies components from three open-source repositories:

| Repository | What Was Reused |
|---|---|
| **pdf-to-slides-ai-generator** | `PDFProcessor` → PDF text extraction with PyPDF2; `PPTGenerator` → python-pptx slide creation by type; FastAPI endpoint patterns; Pydantic data models |
| **presenton** | `DocumentsLoader` → multi-format document loading; `ScoreBasedChunker` → heading-based text chunking with scoring; FastAPI project structure |
| **slide-deck-ai** | `SlideDeckAI.generate()` → LLM prompting flow for slide JSON generation; prompt template approach; PPTX template handling |

Each module in `modules/` documents which source components it adapts from.

---

## 🏗 Architecture

```
User uploads PDF/TXT
        │
        ▼
┌─ Document Loader ─┐    (PyPDF2 extraction — from pdf-to-slides)
└───────┬───────────┘
        ▼
┌─ Text Chunker ────┐    (Recursive splitting — from presenton)
└───────┬───────────┘
        ▼
┌─ RAG Engine ──────┐    (FAISS embeddings + Google AI)
│  Store in FAISS   │
└───────┬───────────┘
        │  User enters topic
        ▼
┌─ Slide Generator ─┐    (Gemini LLM — from pdf-to-slides + slide-deck-ai)
│  JSON outline     │
└───────┬───────────┘
        ▼
┌─ PPTX Builder ────┐    (python-pptx themed — from pdf-to-slides)
│  Dark lab theme   │
│  Fade animations  │
└───────┬───────────┘
        ▼
  Download .PPTX
```

---

## 🚀 Installation

### Prerequisites
- Python 3.10+
- A Google Gemini API key ([get one free](https://aistudio.google.com/apikey))

### Setup

```bash
# 1. Navigate to the project
cd slideweaver

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create .env file
copy .env.example .env
# Edit .env and add your API key:
# GOOGLE_API_KEY=your_gemini_api_key_here
```

---

## ⚙ Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_API_KEY` | ✅ | Google Gemini API key for LLM and embeddings |

---

## ▶ Running the Application

```bash
# Start the backend server
cd slideweaver
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Then open **http://localhost:8000** in your browser.

---

## 🎯 How to Generate Presentations

1. Open the web interface at `http://localhost:8000`
2. **Upload Documents** — Drag-and-drop or click to upload PDF/TXT files
3. **Enter a Topic** — Type your briefing topic or query
4. **Set Slide Count** — Use the slider (3-12 slides)
5. **Click Generate** — Wait for the AI to create your briefing
6. **Download** — Click the download button to get your `.pptx` file

---

## 📡 API Endpoints

### `POST /upload-documents`
Upload one or more PDF/TXT files.

```bash
curl -X POST http://localhost:8000/upload-documents \
  -F "files=@document.pdf" \
  -F "files=@notes.txt"
```

**Response:**
```json
{
  "status": "success",
  "message": "Uploaded 2 document(s). Extracted 15 chunks.",
  "chunks_count": 15,
  "index_built": true
}
```

### `POST /generate-presentation`
Generate a themed presentation from uploaded documents.

```bash
curl -X POST http://localhost:8000/generate-presentation \
  -F "topic=Key findings and recommendations" \
  -F "num_slides=6"
```

**Response:**
```json
{
  "status": "success",
  "filename": "briefing_abc12345.pptx",
  "download_url": "/download-presentation/briefing_abc12345.pptx",
  "slides_count": 7,
  "title": "Key Findings Analysis"
}
```

### `GET /download-presentation/{filename}`
Download a generated presentation file.

```bash
curl -O http://localhost:8000/download-presentation/briefing_abc12345.pptx
```

---

## 🎨 Theme Details

The Stranger Things / Hawkins Lab aesthetic includes:

**Frontend UI:**
- Dark background (`#0b0c10`) with CRT scanline overlay
- Neon red (`#ff2a2a`) and cyan (`#00ffff`) accents
- "Orbitron" and "Press Start 2P" retro fonts
- Radar sweep animations, VHS glitch effects
- Terminal-style input boxes with green cursor blink
- Glowing buttons with hover effects

**Generated Slides:**
- Dark lab-style backgrounds
- Neon red titles with glow effects
- Retro grid overlays
- Cyan accent bars
- Fade-in entrance animations
- "CLASSIFIED" watermarks
- Consolas monospace body text

---

## 📁 Project Structure

```
slideweaver/
├── backend/
│   ├── __init__.py
│   └── main.py               # FastAPI app with 3 endpoints
├── frontend/
│   ├── index.html             # Stranger Things themed UI
│   ├── style.css              # Hawkins Lab CSS
│   └── app.js                 # Client-side logic
├── modules/
│   ├── __init__.py
│   ├── document_loader.py     # PDF/TXT text extraction
│   ├── chunker.py             # Text chunking for RAG
│   ├── rag_engine.py          # FAISS vector store
│   ├── slide_generator.py     # Gemini LLM slide generation
│   ├── pptx_builder.py        # Themed PPTX creation
│   └── citation_builder.py    # Reference slide builder
├── data/                      # Uploaded documents
├── vector_store/              # FAISS index storage
├── slides/                    # Generated presentations
├── requirements.txt
├── .env.example
└── README.md
```

---

## 🧪 Built With

- **FastAPI** — Backend API framework
- **python-pptx** — PowerPoint generation
- **PyPDF2** — PDF text extraction
- **FAISS** — Vector similarity search
- **Google Gemini** — LLM for slide content generation
- **Vanilla HTML/CSS/JS** — Retro-themed frontend

---

*"Why are you keeping this curiosity door locked?" — Mr. Clarke*
