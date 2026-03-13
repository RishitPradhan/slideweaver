"""
Theme Engine Module
Adapted from presenton: theme_utils.py (OKLCH-based color palette generation)

Generates dynamic color palettes with WCAG contrast compliance.
Provides pre-built theme presets for the presentation builder.
"""

import math
import random
from dataclasses import dataclass
from typing import Dict, Optional, Tuple
from pptx.dml.color import RGBColor


# ── OKLCH Color Space Helpers ────────────────────────────────────

@dataclass
class Oklch:
    l: float  # Lightness 0-1
    c: float  # Chroma 0-0.4
    h: float  # Hue 0-360


def _clamp(value: float, min_val: float = 0.0, max_val: float = 1.0) -> float:
    return max(min_val, min(max_val, value))


def _oklch_to_srgb(color: Oklch) -> Tuple[float, float, float]:
    """Convert OKLCH to sRGB (0-1 range per channel)."""
    l, c, h = color.l, color.c, math.radians(color.h)
    a_ = c * math.cos(h)
    b_ = c * math.sin(h)

    L = (l + 0.3963377774 * a_ + 0.2158037573 * b_)
    M = (l - 0.1055613458 * a_ - 0.0638541728 * b_)
    S = (l - 0.0894841775 * a_ - 1.2914855480 * b_)

    L = L ** 3 if L > 0 else 0
    M = M ** 3 if M > 0 else 0
    S = S ** 3 if S > 0 else 0

    r = +4.0767416621 * L - 3.3077115913 * M + 0.2309699292 * S
    g = -1.2684380046 * L + 2.6097574011 * M - 0.3413193965 * S
    b = -0.0041960863 * L - 0.7034186147 * M + 1.7076147010 * S

    def linear_to_srgb(ch):
        if ch <= 0.0031308:
            return 12.92 * ch
        return 1.055 * (ch ** (1.0 / 2.4)) - 0.055

    return (
        _clamp(linear_to_srgb(r)),
        _clamp(linear_to_srgb(g)),
        _clamp(linear_to_srgb(b)),
    )


def _oklch_to_hex(color: Oklch) -> str:
    """Convert OKLCH to hex color string."""
    r, g, b = _oklch_to_srgb(color)
    return f"{int(r*255):02x}{int(g*255):02x}{int(b*255):02x}"


def _oklch_to_rgb_color(color: Oklch) -> RGBColor:
    """Convert OKLCH to python-pptx RGBColor."""
    r, g, b = _oklch_to_srgb(color)
    return RGBColor(int(r * 255), int(g * 255), int(b * 255))


def _relative_luminance(color: Oklch) -> float:
    """Calculate relative luminance for WCAG contrast."""
    r, g, b = _oklch_to_srgb(color)

    def linearize(ch):
        return ch / 12.92 if ch <= 0.04045 else ((ch + 0.055) / 1.055) ** 2.4

    return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b)


def _wcag_contrast(a: Oklch, b: Oklch) -> float:
    """WCAG 2.0 contrast ratio between two colors."""
    l1 = _relative_luminance(a)
    l2 = _relative_luminance(b)
    lighter = max(l1, l2)
    darker = min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)


# ── Color Palette Generator ─────────────────────────────────────

def generate_color_palette(
    primary_hex: Optional[str] = None,
    background_hex: Optional[str] = None,
) -> Dict[str, str]:
    """
    Generate a harmonious color palette.
    Returns dict with hex colors: primary, background, accent1, accent2, text1, text2
    """
    if primary_hex:
        # Parse provided primary
        r = int(primary_hex[:2], 16) / 255
        g = int(primary_hex[2:4], 16) / 255
        b = int(primary_hex[4:6], 16) / 255
        primary = Oklch(0.6, 0.15, random.uniform(0, 360))
    else:
        # Generate random primary
        hue = random.uniform(0, 360)
        primary = Oklch(l=random.uniform(0.5, 0.7), c=random.uniform(0.1, 0.2), h=hue)

    # Background: very dark or very light based on primary
    is_dark_theme = True  # Default to dark themes
    if is_dark_theme:
        bg = Oklch(l=0.15, c=0.02, h=primary.h)
    else:
        bg = Oklch(l=0.97, c=0.01, h=primary.h)

    # Accent 1: shift hue by ~120°
    accent1 = Oklch(l=0.65, c=0.15, h=(primary.h + 120) % 360)

    # Accent 2: shift hue by ~240°
    accent2 = Oklch(l=0.60, c=0.12, h=(primary.h + 240) % 360)

    # Text colors with good contrast
    if is_dark_theme:
        text1 = Oklch(l=0.93, c=0.01, h=primary.h)
        text2 = Oklch(l=0.70, c=0.02, h=primary.h)
    else:
        text1 = Oklch(l=0.15, c=0.02, h=primary.h)
        text2 = Oklch(l=0.40, c=0.03, h=primary.h)

    # Verify contrast
    bg_text_contrast = _wcag_contrast(bg, text1)
    if bg_text_contrast < 4.5:
        # Adjust text lightness for better contrast
        text1 = Oklch(l=0.98 if is_dark_theme else 0.10, c=0.01, h=primary.h)

    return {
        "primary": _oklch_to_hex(primary),
        "background": _oklch_to_hex(bg),
        "accent1": _oklch_to_hex(accent1),
        "accent2": _oklch_to_hex(accent2),
        "text1": _oklch_to_hex(text1),
        "text2": _oklch_to_hex(text2),
    }


# ── Pre-built Theme Presets ──────────────────────────────────────

THEME_PRESETS: Dict[str, Dict[str, str]] = {
    "hawkins_dark": {
        "name": "Hawkins Lab Dark",
        "primary": "ff2a2a",
        "background": "0b0c10",
        "accent1": "00ffff",
        "accent2": "39ff14",
        "text1": "dddddd",
        "text2": "888888",
        "title_font": "Arial Black",
        "body_font": "Consolas",
    },
    "corporate": {
        "name": "Corporate Blue",
        "primary": "1a73e8",
        "background": "ffffff",
        "accent1": "34a853",
        "accent2": "fbbc04",
        "text1": "202124",
        "text2": "5f6368",
        "title_font": "Arial",
        "body_font": "Calibri",
    },
    "minimal": {
        "name": "Minimal Dark",
        "primary": "e8eaed",
        "background": "1a1a2e",
        "accent1": "16213e",
        "accent2": "0f3460",
        "text1": "e8eaed",
        "text2": "9aa0a6",
        "title_font": "Segoe UI",
        "body_font": "Segoe UI",
    },
    "sunset": {
        "name": "Sunset Warm",
        "primary": "ff6b35",
        "background": "1a0a2e",
        "accent1": "f7c59f",
        "accent2": "efefd0",
        "text1": "f0e6d3",
        "text2": "b8a89a",
        "title_font": "Georgia",
        "body_font": "Arial",
    },
    "forest": {
        "name": "Forest Green",
        "primary": "2d6a4f",
        "background": "081c15",
        "accent1": "40916c",
        "accent2": "95d5b2",
        "text1": "d8f3dc",
        "text2": "74c69d",
        "title_font": "Trebuchet MS",
        "body_font": "Calibri",
    },
}


def get_theme(theme_name: str) -> Dict[str, str]:
    """Get a theme preset by name, or generate one if 'auto'."""
    if theme_name == "auto":
        palette = generate_color_palette()
        palette["name"] = "Auto Generated"
        palette["title_font"] = "Arial"
        palette["body_font"] = "Calibri"
        return palette
    return THEME_PRESETS.get(theme_name, THEME_PRESETS["hawkins_dark"])


def hex_to_rgb_color(hex_str: str) -> RGBColor:
    """Convert a hex color string to python-pptx RGBColor."""
    hex_str = hex_str.lstrip("#")
    return RGBColor(
        int(hex_str[0:2], 16),
        int(hex_str[2:4], 16),
        int(hex_str[4:6], 16),
    )
