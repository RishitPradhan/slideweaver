"""
PPTX Builder Module
Adapted from:
  - pdf-to-slides-ai-generator: PPTGenerator
  - presenton: PptxPresentationCreator (shapes, fonts, shadows, images)

Creates themed PPTX presentations with dynamic color palettes,
images, shadows, and rich formatting.
"""

import os
import uuid
from typing import Dict, Any, List, Optional

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

from modules.theme_engine import get_theme, hex_to_rgb_color, THEME_PRESETS


SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)


class PptxBuilder:
    """Generates themed PPTX presentations with images and dynamic themes."""

    def __init__(self, output_dir: str = "slides", theme_name: str = "hawkins_dark"):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)
        self.set_theme(theme_name)

    def set_theme(self, theme_name: str):
        """Set the active theme."""
        self.theme = get_theme(theme_name)
        self.bg_color = hex_to_rgb_color(self.theme["background"])
        self.primary = hex_to_rgb_color(self.theme["primary"])
        self.accent1 = hex_to_rgb_color(self.theme["accent1"])
        self.accent2 = hex_to_rgb_color(self.theme["accent2"])
        self.text1 = hex_to_rgb_color(self.theme["text1"])
        self.text2 = hex_to_rgb_color(self.theme["text2"])
        self.title_font = self.theme.get("title_font", "Arial Black")
        self.body_font = self.theme.get("body_font", "Consolas")

    def build(self, slide_data: Dict[str, Any]) -> str:
        prs = Presentation()
        prs.slide_width = SLIDE_W
        prs.slide_height = SLIDE_H

        slides = slide_data.get("slides", [])
        if not slides:
            slides = [{"type": "title", "title": slide_data.get("title", "Briefing"), "subtitle": slide_data.get("subtitle", "")}]

        for s in slides:
            t = s.get("type", "content")
            if t == "title":
                self._add_title_slide(prs, s)
            elif t == "toc":
                self._add_toc_slide(prs, s)
            elif t == "bullet_points":
                self._add_bullet_slide(prs, s)
            elif t == "image" or s.get("__image_path__"):
                self._add_image_slide(prs, s)
            elif t == "citation":
                self._add_citation_slide(prs, s)
            else:
                self._add_content_slide(prs, s)

        fid = str(uuid.uuid4())[:8]
        fp = os.path.join(self.output_dir, f"briefing_{fid}.pptx")
        prs.save(fp)
        return fp

    # ── helpers ───────────────────────────────────────────────────

    def _dark_bg(self, slide):
        """Add a full-slide background rectangle."""
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, SLIDE_W, SLIDE_H)
        bg.fill.solid()
        bg.fill.fore_color.rgb = self.bg_color
        bg.line.fill.background()
        sp = bg._element
        sp.getparent().insert(0, sp)

    def _accent_bar(self, slide):
        """Accent left bar using accent1 color."""
        bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, Inches(1.3), Inches(0.08), Inches(6.2))
        bar.fill.solid()
        bar.fill.fore_color.rgb = self.accent1
        bar.line.fill.background()

    def _title_bar(self, slide):
        """Dark panel behind the title."""
        # Slightly lighter than background
        panel_r = min(255, self.bg_color[0] + 15)
        panel_g = min(255, self.bg_color[1] + 15)
        panel_b = min(255, self.bg_color[2] + 15)
        panel_color = RGBColor(panel_r, panel_g, panel_b)

        tb = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, SLIDE_W, Inches(1.3))
        tb.fill.solid()
        tb.fill.fore_color.rgb = panel_color
        tb.line.fill.background()

    def _add_title_text(self, slide, text, top=Inches(0.2)):
        box = slide.shapes.add_textbox(Inches(0.6), top, Inches(12), Inches(0.9))
        p = box.text_frame.paragraphs[0]
        p.text = str(text)
        p.font.size = Pt(30)
        p.font.bold = True
        p.font.color.rgb = self.primary
        p.font.name = self.title_font

    def _notes(self, slide, data):
        n = data.get("speaker_notes", "")
        if n:
            slide.notes_slide.notes_text_frame.text = str(n)

    def _add_shadow_to_shape(self, shape):
        """Add a subtle shadow to a shape via XML manipulation."""
        try:
            from lxml import etree
            spPr = shape._element.find('.//{http://schemas.openxmlformats.org/drawingml/2006/main}spPr')
            if spPr is not None:
                nsmap = {'a': 'http://schemas.openxmlformats.org/drawingml/2006/main'}
                effectLst = etree.SubElement(spPr, '{http://schemas.openxmlformats.org/drawingml/2006/main}effectLst')
                outerShdw = etree.SubElement(effectLst, '{http://schemas.openxmlformats.org/drawingml/2006/main}outerShdw')
                outerShdw.set('blurRad', '50800')
                outerShdw.set('dist', '38100')
                outerShdw.set('dir', '5400000')
                outerShdw.set('algn', 'tl')
                srgbClr = etree.SubElement(outerShdw, '{http://schemas.openxmlformats.org/drawingml/2006/main}srgbClr')
                srgbClr.set('val', '000000')
                alpha = etree.SubElement(srgbClr, '{http://schemas.openxmlformats.org/drawingml/2006/main}alpha')
                alpha.set('val', '40000')
        except Exception:
            pass

    # ── Title Slide ───────────────────────────────────────────────

    def _add_title_slide(self, prs, data):
        slide = prs.slides.add_slide(prs.slide_layouts[6])
        self._dark_bg(slide)

        # Accent line top
        lt = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(1.5), Inches(1.8), Inches(10.3), Pt(3))
        lt.fill.solid(); lt.fill.fore_color.rgb = self.primary; lt.line.fill.background()

        # Title
        tb = slide.shapes.add_textbox(Inches(1), Inches(2.2), Inches(11.3), Inches(2))
        tf = tb.text_frame; tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = str(data.get("title", "PRESENTATION"))
        p.font.size = Pt(44); p.font.bold = True; p.font.color.rgb = self.primary
        p.font.name = self.title_font; p.alignment = PP_ALIGN.CENTER

        # Subtitle
        sb = slide.shapes.add_textbox(Inches(1.5), Inches(4.4), Inches(10.3), Inches(1))
        sf = sb.text_frame; sf.word_wrap = True
        sp = sf.paragraphs[0]
        sp.text = str(data.get("subtitle", data.get("content", "")))
        sp.font.size = Pt(22); sp.font.color.rgb = self.accent1
        sp.font.name = self.body_font; sp.alignment = PP_ALIGN.CENTER

        # Accent line bottom
        lb = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(1.5), Inches(5.8), Inches(10.3), Pt(3))
        lb.fill.solid(); lb.fill.fore_color.rgb = self.primary; lb.line.fill.background()

        # Badge
        bb = slide.shapes.add_textbox(Inches(3.5), Inches(6.4), Inches(6.3), Inches(0.5))
        bp = bb.text_frame.paragraphs[0]
        bp.text = self.theme.get("name", "PRESENTATION").upper()
        bp.font.size = Pt(11); bp.font.color.rgb = self.text2
        bp.font.name = "Courier New"; bp.alignment = PP_ALIGN.CENTER

        self._notes(slide, data)

    # ── TOC Slide ─────────────────────────────────────────────────

    def _add_toc_slide(self, prs, data):
        slide = prs.slides.add_slide(prs.slide_layouts[6])
        self._dark_bg(slide)
        self._title_bar(slide)
        self._accent_bar(slide)
        self._add_title_text(slide, data.get("title", "Table of Contents"))

        items = data.get("bullet_points", data.get("items", []))
        if items:
            box = slide.shapes.add_textbox(Inches(1.0), Inches(1.8), Inches(11), Inches(5))
            tf = box.text_frame; tf.word_wrap = True
            for i, item in enumerate(items):
                p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
                p.text = f"  {i + 1}.  {item}"
                p.font.size = Pt(20); p.font.color.rgb = self.text1
                p.font.name = self.body_font; p.space_after = Pt(14)

        self._notes(slide, data)

    # ── Bullet Slide ──────────────────────────────────────────────

    def _add_bullet_slide(self, prs, data):
        slide = prs.slides.add_slide(prs.slide_layouts[6])
        self._dark_bg(slide)
        self._title_bar(slide)
        self._accent_bar(slide)
        self._add_title_text(slide, data.get("title", "Key Points"))

        bullets = data.get("bullet_points", [])
        if bullets:
            box = slide.shapes.add_textbox(Inches(1.0), Inches(1.8), Inches(11), Inches(5))
            tf = box.text_frame; tf.word_wrap = True
            for i, bt in enumerate(bullets):
                p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
                p.text = "▸  " + str(bt)
                p.font.size = Pt(20); p.font.color.rgb = self.text1
                p.font.name = self.body_font; p.space_after = Pt(16)

        self._notes(slide, data)

    # ── Content Slide ─────────────────────────────────────────────

    def _add_content_slide(self, prs, data):
        slide = prs.slides.add_slide(prs.slide_layouts[6])
        self._dark_bg(slide)
        self._title_bar(slide)
        self._accent_bar(slide)
        self._add_title_text(slide, data.get("title", "Analysis"))

        content = data.get("content", "")
        if not content and data.get("bullet_points"):
            content = "\n\n".join(str(b) for b in data["bullet_points"])
        if content:
            box = slide.shapes.add_textbox(Inches(1.0), Inches(1.8), Inches(11), Inches(5))
            tf = box.text_frame; tf.word_wrap = True
            p = tf.paragraphs[0]
            p.text = str(content)
            p.font.size = Pt(18); p.font.color.rgb = self.text1
            p.font.name = self.body_font; p.line_spacing = Pt(28)

        self._notes(slide, data)

    # ── Image Slide ───────────────────────────────────────────────

    def _add_image_slide(self, prs, data):
        slide = prs.slides.add_slide(prs.slide_layouts[6])
        self._dark_bg(slide)
        self._title_bar(slide)
        self._add_title_text(slide, data.get("title", "Visual Analysis"))

        image_path = data.get("__image_path__")
        if image_path and os.path.exists(image_path):
            # Add image centered below title
            try:
                img = slide.shapes.add_picture(
                    image_path,
                    Inches(1.5), Inches(1.6),
                    Inches(10.3), Inches(5.2),
                )
                self._add_shadow_to_shape(img)
            except Exception as e:
                print(f"[PptxBuilder] Could not add image: {e}")
                # Fallback to content
                content = data.get("content", "Image could not be loaded.")
                box = slide.shapes.add_textbox(Inches(1.0), Inches(3.0), Inches(11), Inches(3))
                tf = box.text_frame; tf.word_wrap = True
                p = tf.paragraphs[0]
                p.text = str(content)
                p.font.size = Pt(18); p.font.color.rgb = self.text1
                p.font.name = self.body_font
        else:
            # No image, render as content slide
            content = data.get("content", "")
            if content:
                box = slide.shapes.add_textbox(Inches(1.0), Inches(1.8), Inches(11), Inches(5))
                tf = box.text_frame; tf.word_wrap = True
                p = tf.paragraphs[0]
                p.text = str(content)
                p.font.size = Pt(18); p.font.color.rgb = self.text1
                p.font.name = self.body_font

        self._notes(slide, data)

    # ── Citation Slide ────────────────────────────────────────────

    def _add_citation_slide(self, prs, data):
        slide = prs.slides.add_slide(prs.slide_layouts[6])
        self._dark_bg(slide)
        self._title_bar(slide)
        self._accent_bar(slide)
        self._add_title_text(slide, data.get("title", "References"))

        refs = data.get("bullet_points", data.get("references", data.get("content", "")))
        if isinstance(refs, list):
            refs = "\n".join(str(r) for r in refs)
        if refs:
            box = slide.shapes.add_textbox(Inches(1.0), Inches(1.8), Inches(11), Inches(5))
            tf = box.text_frame; tf.word_wrap = True
            p = tf.paragraphs[0]
            p.text = str(refs)
            p.font.size = Pt(16); p.font.color.rgb = self.text2
            p.font.name = "Courier New"

        self._notes(slide, data)
