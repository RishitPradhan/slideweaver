"""
Slide Generator Module
Adapted from:
  - pdf-to-slides-ai-generator: PDFProcessor.generate_presentation_content() (LLM prompting)
  - slide-deck-ai: SlideDeckAI.generate() (prompt template approach for slide JSON)

Uses Ollama with Llama 3 to generate structured slide outlines from document context.
Includes offline text-based generation as fallback.
"""

import json
import os
import re
import requests
from typing import Dict, Any, List, Optional


OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")


class SlideGenerator:
    """
    Generates presentation slide content using Ollama (Llama 3).
    Takes retrieved document context and a user topic, produces
    a structured JSON slide outline.

    Falls back to offline text-based generation if Ollama is unavailable.
    """

    def __init__(self, model: str = None, base_url: str = None):
        """
        Args:
            model: Ollama model name (default: llama3).
            base_url: Ollama API URL (default: http://localhost:11434).
        """
        self.model = model or OLLAMA_MODEL
        self.base_url = base_url or OLLAMA_BASE_URL

    def generate_outline(
        self,
        topic: str,
        context: List[str],
        num_slides: int = 6,
    ) -> Dict[str, Any]:
        """
        Generate a presentation outline. Tries Ollama first,
        falls back to offline text-based generation if unavailable.

        Args:
            topic: The presentation topic or user query.
            context: List of relevant document chunks from RAG.
            num_slides: Target number of content slides.

        Returns:
            Dictionary with presentation structure (title, slides).
        """
        try:
            return self._call_ollama(topic, context, num_slides)
        except Exception as e:
            print(f"[SlideGenerator] Ollama error: {e}")
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

        system_prompt = """You are Mr. Clarke, the beloved science teacher from Stranger Things.
You create exciting, educational presentations that explain complex topics in a way that
makes students feel like they're uncovering classified Hawkins Lab research.

Your style is enthusiastic, clear, and uses analogies from science and the supernatural.
You structure information logically and make every slide feel like a discovery.

IMPORTANT: You must respond with ONLY valid JSON. No other text before or after the JSON."""

        user_prompt = f"""Create a presentation about the following topic using the provided document context.

TOPIC: {topic}

DOCUMENT CONTEXT:
{context_text[:6000]}

Generate exactly {num_slides} content slides plus 1 title slide.

Respond with ONLY valid JSON in this exact structure (no markdown, no code fences, just raw JSON):
{{
    "title": "Main Presentation Title",
    "subtitle": "A compelling subtitle",
    "slides": [
        {{
            "type": "title",
            "title": "Presentation Title",
            "subtitle": "Subtitle text",
            "speaker_notes": "Brief intro notes"
        }},
        {{
            "type": "bullet_points",
            "title": "Slide Title",
            "bullet_points": ["Point 1", "Point 2", "Point 3", "Point 4"],
            "speaker_notes": "Expanded explanation for the presenter"
        }},
        {{
            "type": "content",
            "title": "Slide Title",
            "content": "A paragraph of detailed content text",
            "speaker_notes": "Additional context for the presenter"
        }}
    ]
}}

Rules:
- Mix "bullet_points" and "content" slide types for variety
- Each bullet_points slide should have 3-5 bullet points
- Content slides should have 2-3 sentences
- Speaker notes should add value beyond what's on the slide
- Make titles engaging and descriptive
- Extract the most important information from the context
- The title slide must be the first slide with type "title"
- Respond with ONLY the JSON object, nothing else
"""

        # Call Ollama API
        response = requests.post(
            f"{self.base_url}/api/generate",
            json={
                "model": self.model,
                "prompt": user_prompt,
                "system": system_prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "num_predict": 4096,
                },
            },
            timeout=120,
        )

        if response.status_code != 200:
            raise RuntimeError(f"Ollama returned status {response.status_code}: {response.text}")

        result_text = response.json().get("response", "")

        # Parse JSON from response (handle markdown code fences if present)
        return self._extract_json(result_text)

    def _extract_json(self, text: str) -> Dict[str, Any]:
        """Extract and parse JSON from LLM response text."""
        # Remove markdown code fences if present
        text = text.strip()
        if text.startswith("```"):
            # Remove opening fence (```json or ```)
            text = re.sub(r'^```(?:json)?\s*\n?', '', text)
            # Remove closing fence
            text = re.sub(r'\n?```\s*$', '', text)

        # Try direct parse
        try:
            return json.loads(text.strip())
        except json.JSONDecodeError:
            pass

        # Try to find JSON object in the text
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
        """
        Generate a presentation using text extraction only (no LLM).
        Splits document context into slides based on content analysis.
        This is the ultimate fallback when Ollama is unavailable.
        """
        full_text = "\n\n".join(context) if context else topic

        # Split into sentences
        sentences = re.split(r'(?<=[.!?])\s+', full_text)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 15]

        if not sentences:
            sentences = [chunk[:200] for chunk in context if chunk.strip()]

        slides = []

        # Title slide
        slides.append({
            "type": "title",
            "title": topic.upper() if len(topic) < 60 else topic[:57] + "...",
            "subtitle": "Automated Intelligence Briefing — Hawkins Lab",
            "speaker_notes": "This briefing was generated using offline text extraction mode.",
        })

        # Distribute sentences across slides
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

                title = self._extract_title(slide_sentences[0]) if slide_sentences else f"Analysis Part {i + 1}"
                slides.append({
                    "type": "bullet_points",
                    "title": title,
                    "bullet_points": bullets,
                    "speaker_notes": f"Key points extracted from document section {i + 1}.",
                })
            else:
                content = " ".join(slide_sentences)
                if len(content) > 400:
                    content = content[:397] + "..."

                title = self._extract_title(slide_sentences[0]) if slide_sentences else f"Details — Section {i + 1}"
                slides.append({
                    "type": "content",
                    "title": title,
                    "content": content,
                    "speaker_notes": f"Detailed analysis from document section {i + 1}.",
                })

        return {
            "title": topic,
            "subtitle": "Automated Intelligence Briefing",
            "slides": slides,
        }

    def _extract_title(self, sentence: str) -> str:
        """Extract a short title from a sentence."""
        if len(sentence) <= 50:
            title = sentence.rstrip(".")
        else:
            title = sentence[:50]
            last_space = title.rfind(" ")
            if last_space > 20:
                title = title[:last_space]
            title = title.rstrip(".,;:—-") + "..."

        return title.capitalize()

    def generate_without_context(
        self,
        topic: str,
        num_slides: int = 6,
    ) -> Dict[str, Any]:
        """Generate a presentation outline from just a topic."""
        return self.generate_outline(topic, [], num_slides)
