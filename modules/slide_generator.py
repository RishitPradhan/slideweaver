"""
Slide Generator Module
Adapted from:
  - pdf-to-slides-ai-generator: PDFProcessor.generate_presentation_content()
  - slide-deck-ai: SlideDeckAI.generate()
  - presenton: LLMClient structured output

Uses Google Gemini as primary LLM (falls back to Ollama, then offline).
Supports tone, verbosity, language, image prompts, and TOC.
"""

import json
import os
import re
import requests
from typing import Dict, Any, List, Optional

from modules.gemini_client import GeminiClient


OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")


class SlideGenerator:
    """
    Generates presentation slide content.
    Priority: Gemini → Ollama → Offline text-based.
    """

    def __init__(self, model: str = None, base_url: str = None):
        self.model = model or OLLAMA_MODEL
        self.base_url = base_url or OLLAMA_BASE_URL
        self.gemini = GeminiClient()

    def generate_outline(
        self,
        topic: str,
        context: List[str],
        num_slides: int = 6,
        tone: str = "professional",
        verbosity: str = "standard",
        language: str = "English",
        include_images: bool = True,
        include_toc: bool = False,
    ) -> Dict[str, Any]:
        """
        Generate a presentation outline.
        Tries Gemini first, then Ollama, then offline fallback.
        """
        # Try Gemini first
        if self.gemini.is_available():
            try:
                print("[SlideGenerator] Using Google Gemini...")
                return self.gemini.generate_outline(
                    topic, context, num_slides,
                    tone=tone, verbosity=verbosity, language=language,
                    include_images=include_images, include_toc=include_toc,
                )
            except Exception as e:
                print(f"[SlideGenerator] Gemini error: {e}")

        # Try Ollama
        try:
            print("[SlideGenerator] Trying Ollama...")
            return self._call_ollama(topic, context, num_slides)
        except Exception as e:
            print(f"[SlideGenerator] Ollama error: {e}")

        # Final fallback
        print("[SlideGenerator] Falling back to offline text-based generation.")
        return self._generate_offline(topic, context, num_slides)

    def _call_ollama(
        self,
        topic: str,
        context: List[str],
        num_slides: int,
    ) -> Dict[str, Any]:
        """Call Ollama API to generate the slide outline."""
        context_text = "\n\n".join(context) if context else "No specific context provided."

        system_prompt = """You are an expert presentation designer.
You create clear, well-structured presentations.

IMPORTANT: You must respond with ONLY valid JSON. No other text."""

        user_prompt = f"""Create a presentation about: {topic}

CONTEXT:
{context_text[:6000]}

Generate {num_slides} content slides + 1 title slide.

Respond with ONLY valid JSON:
{{
    "title": "Title",
    "subtitle": "Subtitle",
    "slides": [
        {{"type": "title", "title": "Title", "subtitle": "Sub", "speaker_notes": "Notes"}},
        {{"type": "bullet_points", "title": "Title", "bullet_points": ["P1", "P2"], "speaker_notes": "Notes"}},
        {{"type": "content", "title": "Title", "content": "Text", "speaker_notes": "Notes"}}
    ]
}}
"""

        response = requests.post(
            f"{self.base_url}/api/generate",
            json={
                "model": self.model,
                "prompt": user_prompt,
                "system": system_prompt,
                "stream": False,
                "options": {"temperature": 0.7, "num_predict": 4096},
            },
            timeout=120,
        )

        if response.status_code != 200:
            raise RuntimeError(f"Ollama returned status {response.status_code}")

        return self._extract_json(response.json().get("response", ""))

    def _extract_json(self, text: str) -> Dict[str, Any]:
        """Extract and parse JSON from LLM response text."""
        text = text.strip()
        if text.startswith("```"):
            text = re.sub(r'^```(?:json)?\s*\n?', '', text)
            text = re.sub(r'\n?```\s*$', '', text)

        try:
            return json.loads(text.strip())
        except json.JSONDecodeError:
            pass

        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0 and end > start:
            try:
                return json.loads(text[start:end])
            except json.JSONDecodeError:
                pass

        raise ValueError("Could not extract valid JSON from LLM response")

    def _generate_offline(
        self,
        topic: str,
        context: List[str],
        num_slides: int,
    ) -> Dict[str, Any]:
        """Offline text-based generation fallback."""
        full_text = "\n\n".join(context) if context else topic

        sentences = re.split(r'(?<=[.!?])\s+', full_text)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 15]

        if not sentences:
            sentences = [chunk[:200] for chunk in context if chunk.strip()]

        slides = []
        slides.append({
            "type": "title",
            "title": topic.upper() if len(topic) < 60 else topic[:57] + "...",
            "subtitle": "Automated Intelligence Briefing",
            "speaker_notes": "Generated using offline text extraction mode.",
        })

        sentences_per_slide = max(1, len(sentences) // num_slides)

        for i in range(num_slides):
            start_idx = i * sentences_per_slide
            end_idx = start_idx + sentences_per_slide
            slide_sentences = sentences[start_idx:end_idx]

            if not slide_sentences and i < len(sentences):
                slide_sentences = [sentences[min(i, len(sentences) - 1)]]
            elif not slide_sentences:
                continue

            if i % 2 == 0:
                bullets = []
                for s in slide_sentences[:5]:
                    bullet = s[:120] + "..." if len(s) > 120 else s
                    bullets.append(bullet)
                if not bullets:
                    bullets = ["Key finding from document analysis"]

                title = self._extract_title(slide_sentences[0])
                slides.append({
                    "type": "bullet_points",
                    "title": title,
                    "bullet_points": bullets,
                    "speaker_notes": f"Key points from section {i + 1}.",
                })
            else:
                content = " ".join(slide_sentences)
                if len(content) > 400:
                    content = content[:397] + "..."

                title = self._extract_title(slide_sentences[0])
                slides.append({
                    "type": "content",
                    "title": title,
                    "content": content,
                    "speaker_notes": f"Details from section {i + 1}.",
                })

        return {"title": topic, "subtitle": "Automated Briefing", "slides": slides}

    def _extract_title(self, sentence: str) -> str:
        """Extract a short title from a sentence."""
        if len(sentence) <= 50:
            return sentence.rstrip(".").capitalize()
        title = sentence[:50]
        last_space = title.rfind(" ")
        if last_space > 20:
            title = title[:last_space]
        return title.rstrip(".,;:—-").capitalize() + "..."

    def generate_without_context(
        self,
        topic: str,
        num_slides: int = 6,
        **kwargs,
    ) -> Dict[str, Any]:
        """Generate a presentation outline from just a topic."""
        return self.generate_outline(topic, [], num_slides, **kwargs)
