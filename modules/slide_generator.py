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
import google.generativeai as genai
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

    def __init__(self, api_key: str = None):
        """
        Args:
            api_key: Google Gemini API key.
        """
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel("gemini-1.5-flash")
        else:
            self.model = None

    def generate_outline(
        self,
        topic: str,
        context: List[str],
        num_slides: int = 6,
    ) -> Dict[str, Any]:
        """
        Generate a presentation outline. Tries Gemini first,
        falls back to offline text-based generation if unavailable.
        """
        if self.model:
            try:
                return self._call_gemini(topic, context, num_slides)
            except Exception as e:
                print(f"[SlideGenerator] Gemini error: {e}")
        
        print("[SlideGenerator] Falling back to offline text-based generation.")
        return self._generate_offline(topic, context, num_slides)

    def _call_gemini(
        self,
        topic: str,
        context: List[str],
        num_slides: int,
    ) -> Dict[str, Any]:
        """Call Google Gemini API to generate the slide outline."""

        context_text = "\n\n".join(context) if context else "No specific context provided."

        prompt = f"""You are Mr. Clarke, the beloved science teacher from Stranger Things.
You create exciting, educational presentations that explain complex topics in a way that
makes students feel like they're uncovering classified Hawkins Lab research.

TOPIC: {topic}

DOCUMENT CONTEXT:
{context_text[:12000]}

Generate a presentation outline with exactly {num_slides} items in the "slides" list.
Include 1 title slide at the beginning, and {num_slides - 1} content slides.

IMPORTANT FORMATTING RULES:
- Each bullet_points slide MUST have at most 6 bullet points.
- Each bullet point must be concise — under 120 characters.
- If content is extensive, use multiple slides instead of cramming.
- Use "section_divider" slides to separate major topics.
- Use "two_column" slides when comparing two ideas, lists, or categories.
- Prefer bullet_points over long paragraphs.

Return ONLY a raw JSON object with this structure:
{{
    "title": "Presentation Main Title",
    "subtitle": "Compelling Subtitle",
    "slides": [
        {{
            "type": "title",
            "title": "Slide Title",
            "subtitle": "Subtitle",
            "speaker_notes": "Intro notes"
        }},
        {{
            "type": "bullet_points",
            "title": "Slide Title",
            "bullet_points": ["Point 1", "Point 2", "Point 3"],
            "speaker_notes": "Notes"
        }},
        {{
            "type": "section_divider",
            "title": "New Section Heading",
            "subtitle": "Brief description",
            "speaker_notes": "Notes"
        }},
        {{
            "type": "two_column",
            "title": "Comparison Title",
            "left_column": ["Left point 1", "Left point 2"],
            "right_column": ["Right point 1", "Right point 2"],
            "speaker_notes": "Notes"
        }},
        {{
            "type": "content",
            "title": "Slide Title",
            "content": "Paragraph content (keep under 400 chars)",
            "speaker_notes": "Notes"
        }}
    ]
}}
"""
        response = self.model.generate_content(prompt)
        return self._extract_json(response.text)

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
        """
        # Filter context to be relevant to the topic
        relevant_context = []
        topic_words = set(topic.lower().split())
        for chunk in context:
            if any(word in chunk.lower() for word in topic_words):
                relevant_context.append(chunk)
        
        if not relevant_context:
            relevant_context = context
            
        full_text = "\n\n".join(relevant_context) if relevant_context else topic

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

        # Adjusted count: total requested - 1 (title) - 1 (citation)
        target_content_slides = max(1, num_slides - 2)

        # Distribute sentences across slides
        sentences_per_slide = max(1, len(sentences) // target_content_slides) if target_content_slides > 0 else 1

        for i in range(target_content_slides):
            start_idx = i * sentences_per_slide
            end_idx = start_idx + sentences_per_slide
            slide_sentences = sentences[start_idx:end_idx]

            if not slide_sentences and i < len(sentences):
                slide_sentences = [sentences[min(i, len(sentences) - 1)]]
            elif not slide_sentences:
                # Add a dummy slide if we run out of content
                slide_sentences = ["Detailed analysis from the source document."]

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
