"""
Citation Builder Module
Generates reference/citation slides listing source documents used in the presentation.
"""

from typing import List, Dict, Any


class CitationBuilder:
    """
    Builds citation and reference information for generated presentations.
    Tracks which documents contributed to which slides.
    """

    def __init__(self):
        self.sources: List[Dict[str, str]] = []

    def add_source(self, filename: str, description: str = ""):
        """
        Register a source document.

        Args:
            filename: Name of the source file.
            description: Optional description or page info.
        """
        self.sources.append({
            "filename": filename,
            "description": description or f"Content extracted from {filename}",
        })

    def build_citation_slide(self) -> Dict[str, Any]:
        """
        Build a citation slide data structure for the presentation.

        Returns:
            Slide data dictionary with type 'bullet_points' listing all sources.
        """
        if not self.sources:
            return {
                "type": "bullet_points",
                "title": "📡 Sources & References",
                "bullet_points": ["No external sources were used"],
                "speaker_notes": "This presentation was generated without external document sources.",
            }

        bullet_points = []
        for i, source in enumerate(self.sources, 1):
            entry = f"[{i}] {source['filename']}"
            if source.get("description"):
                entry += f" — {source['description']}"
            bullet_points.append(entry)

        return {
            "type": "bullet_points",
            "title": "📡 Classified Sources & References",
            "bullet_points": bullet_points,
            "speaker_notes": (
                "These are the source documents that were analyzed to generate "
                "this briefing. All information has been extracted and verified "
                "by Hawkins Lab personnel."
            ),
        }

    def build_citations_text(self) -> str:
        """
        Build a plaintext citation list.

        Returns:
            Formatted citation text.
        """
        if not self.sources:
            return "No sources referenced."

        lines = ["References:"]
        for i, source in enumerate(self.sources, 1):
            lines.append(f"  [{i}] {source['filename']}: {source['description']}")
        return "\n".join(lines)
