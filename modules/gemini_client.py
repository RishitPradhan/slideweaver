"""
Gemini LLM Client Module
Adapted from presenton: LLMClient (multi-provider LLM support)

Uses Google Gemini for structured slide outline generation.
"""

import json
import os
import re
from typing import Dict, Any, List, Optional

import google.generativeai as genai


GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")


class GeminiClient:
    """
    Google Gemini LLM client for generating structured presentation outlines.
    """

    def __init__(self, api_key: str = None, model_name: str = "gemini-2.0-flash"):
        self.api_key = api_key or GOOGLE_API_KEY
        self.model_name = model_name
        if self.api_key:
            genai.configure(api_key=self.api_key)

    def is_available(self) -> bool:
        return bool(self.api_key)

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
        Generate a structured slide outline using Gemini.
        """
        if not self.is_available():
            raise RuntimeError("Google API key is not configured.")

        context_text = "\n\n".join(context) if context else "No specific context provided."

        tone_instructions = {
            "professional": "Use a formal, professional tone suitable for business presentations.",
            "casual": "Use a friendly, conversational tone that is engaging and approachable.",
            "academic": "Use a scholarly, research-oriented tone with precise language.",
            "creative": "Use a creative, storytelling tone that captivates the audience.",
        }

        verbosity_instructions = {
            "concise": "Keep content very brief — 2-3 words per bullet, 1 sentence max per content slide.",
            "standard": "Use moderate detail — 5-10 words per bullet, 2-3 sentences per content slide.",
            "detailed": "Provide thorough detail — full sentences per bullet, 3-5 sentences per content slide.",
        }

        image_instruction = ""
        image_slide_example = ""
        if include_images:
            image_instruction = """
IMPORTANT - IMAGE GENERATION:
You MUST include an "__image_prompt__" field on at least 2 slides.
The "__image_prompt__" value should be a detailed prompt for generating an image.
For slides with __image_prompt__, set the type to "image".
"""
            image_slide_example = """,
        {{
            "type": "image",
            "title": "Visual Overview",
            "content": "Caption describing the visual",
            "__image_prompt__": "A professional infographic showing the key concept, clean flat design, modern colors",
            "speaker_notes": "This visual illustrates the main point"
        }}"""

        toc_instruction = ""
        if include_toc:
            toc_instruction = """
Include a Table of Contents slide as the second slide (after the title slide) with type "toc".
It should list all the subsequent slide titles as bullet points."""

        system_prompt = f"""You are an expert presentation designer. You create clear, well-structured
presentations that communicate ideas effectively.

{tone_instructions.get(tone, tone_instructions['professional'])}
{verbosity_instructions.get(verbosity, verbosity_instructions['standard'])}

Generate the presentation in {language}.

IMPORTANT: You must respond with ONLY valid JSON. No other text before or after the JSON."""

        user_prompt = f"""Create a presentation about the following topic using the provided document context.

TOPIC: {topic}

DOCUMENT CONTEXT:
{context_text[:8000]}

Generate exactly {num_slides} content slides plus 1 title slide.
{toc_instruction}
{image_instruction}

Respond with ONLY valid JSON in this exact structure:
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
        }}{image_slide_example}
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

        model = genai.GenerativeModel(self.model_name)
        response = model.generate_content(
            [system_prompt, user_prompt],
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                max_output_tokens=8192,
            ),
        )

        return self._extract_json(response.text)

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

        raise ValueError("Could not extract valid JSON from Gemini response")
