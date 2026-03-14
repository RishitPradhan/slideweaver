"""
Auto Slide Design Engine
========================
Sits between content generation (SlideGenerator) and PPTX building (PptxBuilder).
Transforms raw slide outlines into well-structured, presentation-ready data
with proper layout assignments, bullet-point limits, and content splitting.

Pipeline position:
  PDF Upload -> Content Extraction -> Slide Generation
    -> **Auto Slide Design** -> PPTX Building -> Download

The module does NOT touch the website theme, animations, or frontend code.
It only restructures the JSON slide data that feeds into PptxBuilder.
"""

import re
import textwrap
from typing import Dict, Any, List, Optional


# ── Constants ────────────────────────────────────────────────────
MAX_BULLETS_PER_SLIDE = 6
MAX_BULLET_CHARS = 120
MAX_CONTENT_CHARS = 400
MIN_BULLETS_FOR_TWO_COL = 8  # split into two-column if >= this many


class SlideDesigner:
    """
    Automatically structures and assigns layouts to slide data.

    Supported output layout types
    ─────────────────────────────
    • title              – Title slide (unchanged)
    • bullet_points      – Title + ≤6 bullet points  (Layout A)
    • image_text         – Title + image/chart + right text  (Layout B)
    • chart_slide        – Title + large centered chart  (Layout E)
    • section_divider    – Large centered heading  (Layout C)
    • two_column         – Side-by-side lists  (Layout D)
    • content            – Title + paragraph body
    • citation           – References (unchanged)
    """

    def design(
        self,
        slide_data: Dict[str, Any],
        images: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """
        Main entry point.  Takes a raw slide outline dict and returns
        a refined version with proper layouts, split slides, and
        enforced typography limits.

        Args:
            slide_data: Raw slide outline from the generator.
            images: Optional list of extracted image dicts with 'path', 'page', etc.
        """
        raw_slides = slide_data.get("slides", [])
        if not raw_slides:
            return slide_data

        print(f"[Designer] Input: {len(raw_slides)} slides, {len(images) if images else 0} images.")
        designed: List[Dict[str, Any]] = []

        for i, slide in enumerate(raw_slides):
            slide_type = slide.get("type", "content")

            # Pass-through types that don't need redesign
            if slide_type in ("title", "citation"):
                designed.append(slide)
                continue

            # ── Section divider detection ────────────────────────
            if slide_type == "section_divider":
                designed.append(self._make_section_divider(slide))
                continue

            # Check if LLM already flagged this as a special layout
            if slide_type == "two_column":
                designed.append(self._enforce_two_column(slide))
                continue

            if slide_type == "image_text" or slide.get("image_path"):
                designed.append(self._enforce_image_text(slide))
                continue

            if slide_type == "chart_slide" or slide.get("chart_path"):
                designed.append(self._enforce_chart_slide(slide))
                continue

            # ── Auto-detect best layout ──────────────────────────
            bullets = slide.get("bullet_points", [])
            content = slide.get("content", "")

            # If this is a paragraph-style slide, try to convert to bullets
            if slide_type == "content" and content and not bullets:
                bullets = self._paragraphs_to_bullets(content)

            # If there are enough bullets, consider two-column
            if len(bullets) >= MIN_BULLETS_FOR_TWO_COL:
                designed.append(self._make_two_column(slide, bullets))
                continue

            # If bullets exceed limit, split across multiple slides
            if len(bullets) > MAX_BULLETS_PER_SLIDE:
                designed.extend(self._split_bullet_slides(slide, bullets))
                continue

            # Standard bullet slide with enforcement
            if bullets:
                designed.append(self._enforce_bullet_slide(slide, bullets))
                continue

            # Long content paragraph — split if needed
            if content and len(content) > MAX_CONTENT_CHARS:
                designed.extend(self._split_content_slides(slide, content))
                continue

            # Default: keep as-is with cleaned text
            designed.append(self._clean_slide(slide))

        # Insert section dividers for long presentations
        designed = self._insert_section_dividers(designed)

        # ── Distribute extracted images across slides ────────────
        if images:
            designed = self._assign_images_to_slides(designed, images)

        return {
            "title": slide_data.get("title", ""),
            "subtitle": slide_data.get("subtitle", ""),
            "slides": designed,
        }

    # ═══════════════════════════════════════════════════════════════
    # Content Structuring
    # ═══════════════════════════════════════════════════════════════

    def _paragraphs_to_bullets(self, text: str) -> List[str]:
        """
        Convert a paragraph block into concise bullet points.
        Splits on sentences and trims to MAX_BULLET_CHARS each.
        """
        # Split into sentences
        sentences = re.split(r'(?<=[.!?])\s+', text.strip())
        bullets = []
        for s in sentences:
            s = s.strip()
            if len(s) < 10:
                continue
            # Trim long sentences
            if len(s) > MAX_BULLET_CHARS:
                s = s[:MAX_BULLET_CHARS - 3].rsplit(" ", 1)[0] + "..."
            bullets.append(s)
        return bullets if bullets else [text[:MAX_BULLET_CHARS]]

    def _clean_title(self, title: str, max_len: int = 60) -> str:
        """Ensure title is concise and properly capitalized."""
        title = str(title).strip()
        if len(title) > max_len:
            title = title[:max_len - 3].rsplit(" ", 1)[0] + "..."
        return title

    def _clean_bullet(self, text: str) -> str:
        """Trim a bullet point to max length."""
        text = str(text).strip()
        # Remove existing bullet markers
        text = re.sub(r'^[▸•\-–—\*]\s*', '', text)
        if len(text) > MAX_BULLET_CHARS:
            text = text[:MAX_BULLET_CHARS - 3].rsplit(" ", 1)[0] + "..."
        return text

    def _clean_slide(self, slide: Dict[str, Any]) -> Dict[str, Any]:
        """Basic cleanup: trim title and content, while PRESERVING other fields."""
        result = dict(slide)
        if "title" in result:
            result["title"] = self._clean_title(result["title"])
        if "bullet_points" in result:
            result["bullet_points"] = [
                self._clean_bullet(b) for b in result["bullet_points"]
            ][:MAX_BULLETS_PER_SLIDE]
        return result

    # ═══════════════════════════════════════════════════════════════
    # Layout Assignment
    # ═══════════════════════════════════════════════════════════════

    def _enforce_bullet_slide(
        self, slide: Dict[str, Any], bullets: List[str]
    ) -> Dict[str, Any]:
        """Create a standard bullet slide with enforced limits."""
        return {
            "type": "bullet_points",
            "title": self._clean_title(slide.get("title", "Key Findings")),
            "bullet_points": [
                self._clean_bullet(b) for b in bullets[:MAX_BULLETS_PER_SLIDE]
            ],
            "speaker_notes": slide.get("speaker_notes", ""),
        }

    def _split_bullet_slides(
        self, slide: Dict[str, Any], bullets: List[str]
    ) -> List[Dict[str, Any]]:
        """Split a long list of bullets across multiple slides."""
        cleaned = [self._clean_bullet(b) for b in bullets]
        slides = []
        base_title = self._clean_title(slide.get("title", "Key Findings"), 50)

        for chunk_idx in range(0, len(cleaned), MAX_BULLETS_PER_SLIDE):
            chunk = cleaned[chunk_idx:chunk_idx + MAX_BULLETS_PER_SLIDE]
            part_num = (chunk_idx // MAX_BULLETS_PER_SLIDE) + 1
            total_parts = -(-len(cleaned) // MAX_BULLETS_PER_SLIDE)  # ceil div

            title = base_title
            if total_parts > 1:
                title = f"{base_title} ({part_num}/{total_parts})"

            slides.append({
                "type": "bullet_points",
                "title": title,
                "bullet_points": chunk,
                "speaker_notes": slide.get("speaker_notes", ""),
            })

        return slides

    def _split_content_slides(
        self, slide: Dict[str, Any], content: str
    ) -> List[Dict[str, Any]]:
        """Split long paragraph content across multiple slides."""
        sentences = re.split(r'(?<=[.!?])\s+', content.strip())
        chunks: List[str] = []
        current_chunk = ""

        for s in sentences:
            if len(current_chunk) + len(s) + 1 > MAX_CONTENT_CHARS and current_chunk:
                chunks.append(current_chunk.strip())
                current_chunk = s
            else:
                current_chunk += " " + s if current_chunk else s
        if current_chunk.strip():
            chunks.append(current_chunk.strip())

        if not chunks:
            chunks = [content[:MAX_CONTENT_CHARS]]

        slides = []
        base_title = self._clean_title(slide.get("title", "Analysis"), 50)

        for i, chunk_text in enumerate(chunks):
            title = base_title
            if len(chunks) > 1:
                title = f"{base_title} ({i + 1}/{len(chunks)})"
            slides.append({
                "type": "content",
                "title": title,
                "content": chunk_text,
                "speaker_notes": slide.get("speaker_notes", ""),
            })

        return slides

    def _make_two_column(
        self, slide: Dict[str, Any], bullets: List[str]
    ) -> Dict[str, Any]:
        """
        Convert a long bullet list into a two-column layout.
        Splits bullets evenly between left and right columns.
        """
        cleaned = [self._clean_bullet(b) for b in bullets]
        mid = len(cleaned) // 2
        return {
            "type": "two_column",
            "title": self._clean_title(slide.get("title", "Comparison")),
            "left_column": cleaned[:mid],
            "right_column": cleaned[mid:],
            "speaker_notes": slide.get("speaker_notes", ""),
        }

    def _enforce_two_column(self, slide: Dict[str, Any]) -> Dict[str, Any]:
        """Enforce limits on an already-typed two-column slide."""
        left = slide.get("left_column", slide.get("bullet_points", []))
        right = slide.get("right_column", [])

        # If no explicit columns, split bullets
        if not right and left:
            mid = len(left) // 2
            right = left[mid:]
            left = left[:mid]

        return {
            "type": "two_column",
            "title": self._clean_title(slide.get("title", "Comparison")),
            "left_column": [self._clean_bullet(b) for b in left[:MAX_BULLETS_PER_SLIDE]],
            "right_column": [self._clean_bullet(b) for b in right[:MAX_BULLETS_PER_SLIDE]],
            "speaker_notes": slide.get("speaker_notes", ""),
        }

    def _make_section_divider(self, slide: Dict[str, Any]) -> Dict[str, Any]:
        """Create a section divider slide."""
        return {
            "type": "section_divider",
            "title": self._clean_title(slide.get("title", "Next Section"), 50),
            "subtitle": str(slide.get("subtitle", slide.get("content", ""))).strip()[:120],
            "speaker_notes": slide.get("speaker_notes", ""),
        }

    def _enforce_image_text(self, slide: Dict[str, Any]) -> Dict[str, Any]:
        """Enforce structure for image + text slides."""
        return {
            "type": "image_text",
            "title": self._clean_title(slide.get("title", "Visual Analysis")),
            "content": str(slide.get("content", ""))[:MAX_CONTENT_CHARS],
            "image_description": slide.get("image_description", ""),
            "image_path": slide.get("image_path", ""),
            "speaker_notes": slide.get("speaker_notes", ""),
        }

    def _enforce_chart_slide(self, slide: Dict[str, Any]) -> Dict[str, Any]:
        """Enforce structure for chart slides."""
        return {
            "type": "chart_slide",
            "title": self._clean_title(slide.get("title", "Data Visualization")),
            "chart_path": slide.get("chart_path", ""),
            "chart_data": slide.get("chart_data", {}),
            "speaker_notes": slide.get("speaker_notes", ""),
        }

    # ═══════════════════════════════════════════════════════════════
    # Section Divider Insertion
    # ═══════════════════════════════════════════════════════════════

    def _insert_section_dividers(
        self, slides: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        For presentations with 8+ content slides, insert section
        dividers every 4 content slides to improve flow.
        """
        # Count content slides (excluding title, citation, existing dividers)
        content_slides = [
            s for s in slides
            if s.get("type") not in ("title", "citation", "section_divider")
        ]

        # Only insert dividers for longer presentations
        if len(content_slides) < 8:
            return slides

        result = []
        content_count = 0

        for slide in slides:
            stype = slide.get("type", "content")

            # Don't count non-content slides
            if stype in ("title", "citation", "section_divider"):
                result.append(slide)
                continue

            content_count += 1

            # Insert divider every 4 content slides (but not before the first)
            if content_count > 1 and (content_count - 1) % 4 == 0:
                result.append({
                    "type": "section_divider",
                    "title": f"Section {(content_count - 1) // 4 + 1}",
                    "subtitle": "",
                    "speaker_notes": "",
                })

            result.append(slide)

        return result

    # ═══════════════════════════════════════════════════════════════
    # Image Distribution
    # ═══════════════════════════════════════════════════════════════

    def _assign_images_to_slides(
        self,
        slides: List[Dict[str, Any]],
        images: List[Dict[str, Any]],
    ) -> List[Dict[str, Any]]:
        """
        Distribute extracted images across content slides.
        Converts eligible slides to image_text layout with the
        actual image path so PptxBuilder can insert it.
        """
        import os

        valid_images = [
            img for img in images
            if img.get("path") and os.path.exists(img["path"])
        ]
        if not valid_images:
            return slides

        # Find eligible slides (content or bullet_points)
        eligible_indices = [
            i for i, s in enumerate(slides)
            if s.get("type") in ("content", "bullet_points")
        ]
        print(f"[Designer] Eligible slides: {len(eligible_indices)}, Valid images: {len(valid_images)}")

        result = list(slides)
        img_idx = 0

        for slide_idx in eligible_indices:
            if img_idx >= len(valid_images):
                break

            slide = result[slide_idx]
            img = valid_images[img_idx]

            # Build text content from bullets or paragraph
            content_text = ""
            if slide.get("type") == "bullet_points":
                bullets = slide.get("bullet_points", [])
                content_text = "\n".join(f"▸ {b}" for b in bullets[:4])
            else:
                content_text = slide.get("content", "")

            result[slide_idx] = {
                "type": "image_text",
                "title": slide.get("title", "Visual Analysis"),
                "content": content_text[:MAX_CONTENT_CHARS],
                "image_path": img["path"],
                "image_description": f"Figure from page {img.get('page', 0) + 1}",
                "speaker_notes": slide.get("speaker_notes", ""),
            }
            img_idx += 1

        return result
