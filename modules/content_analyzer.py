"""
Content Analyzer Module
=======================
Analyzes slide text to identify visualization opportunities:
1. Detects numerical data and patterns (for charts).
2. Extracts key concepts/keywords (for illustrative images).
3. Recommends chart types (Bar, Line, Pie) based on data structure.
"""

import re
from typing import List, Dict, Any, Optional

class ContentAnalyzer:
    """
    Analyzes slide data to recommend visualizations (images or charts).
    """

    def analyze_slides(self, slides: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Analyze a list of slides and return visualization hints for each.
        Returns a list of hints corresponding to the slide index.
        """
        hints = []
        for i, slide in enumerate(slides):
            hint = self.analyze_slide(slide)
            if hint:
                hint["slide_index"] = i
                hints.append(hint)
        return hints

    def analyze_slide(self, slide: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Analyze a single slide and determine if it needs a chart or an image.
        Priority: Chart (if data found) > Image (if keywords found).
        """
        content = slide.get("content", "")
        bullets = slide.get("bullet_points", [])
        title = slide.get("title", "")
        
        full_text = f"{title} {content} {' '.join(bullets)}"

        # 1. Try to detect numerical data for charts
        chart_data = self._extract_chart_data(full_text)
        if chart_data:
            return {
                "type": "chart",
                "chart_type": self._recommend_chart_type(chart_data),
                "data": chart_data,
                "title": title
            }

        # 2. Extract keywords for conceptual images
        keywords = self._extract_keywords(full_text)
        if keywords:
            return {
                "type": "image",
                "prompt": f"Professional conceptual illustration of {', '.join(keywords)}",
                "keywords": keywords,
                "title": title
            }

        return None

    def _extract_chart_data(self, text: str) -> Optional[Dict[str, Any]]:
        """
        Look for patterns like "20% in 2021 to 45% in 2023" or "A: 10, B: 20".
        Returns {labels: [], values: []}
        """
        # 1. Year and Percentage/Currency pairs
        # e.g. "2021: $500M", "2022: $800M", "2021 (45%)", "2021... 45%"
        # Find years
        years = re.findall(r'(\d{4})', text)
        # Find percentages or currency
        # e.g. 45%, $50B, $800M, 12,000
        stats = re.findall(r'(\d+(?:\.\d+)?)\s*%', text)
        currency = re.findall(r'\$\s*(\d+(?:\.\d+)?)\s*([BMK]?)', text)

        # Case A: Year-Percentage trend
        if len(stats) >= 2:
            labels = years[:len(stats)] if len(years) >= len(stats) else [f"Point {i+1}" for i in range(len(stats))]
            return {
                "labels": labels,
                "values": [float(s) for s in stats],
                "unit": "%"
            }

        # Case B: Year-Currency trend
        if len(currency) >= 2:
            labels = years[:len(currency)] if len(years) >= len(currency) else [f"Point {i+1}" for i in range(len(currency))]
            values = []
            for val, mult in currency:
                v = float(val)
                if mult == 'B': v *= 1000
                elif mult == 'M': v *= 1 # Base unit Million
                values.append(v)
            return {
                "labels": labels,
                "values": values,
                "unit": "$" + (currency[0][1] if currency[0][1] else "")
            }

        # Case C: Labels and numbers (Bar chart candidate)
        # Looking for "Label: Number" or "Label (Number)"
        label_num_matches = re.findall(r'([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s*[:(]\s*(\d+(?:\.\d+)?)', text)
        if len(label_num_matches) >= 2:
            return {
                "labels": [m[0] for m in label_num_matches],
                "values": [float(m[1]) for m in label_num_matches],
                "unit": ""
            }

        return None

    def _recommend_chart_type(self, data: Dict[str, Any]) -> str:
        """Decide between line, bar, or pie."""
        labels = data.get("labels", [])
        
        # If labels look like years, use line chart
        if all(re.match(r'^\d{4}$', str(l)) for l in labels):
            return "line"
        
        # If it's a few percentages that add up near 100, use pie
        if data.get("unit") == "%" and 80 <= sum(data.get("values", [])) <= 105:
            return "pie"
            
        return "bar"

    def _extract_keywords(self, text: str) -> List[str]:
        """
        Extract meaningful noun-phrases or keywords (skipping stop words).
        """
        # Very basic keyword extraction for now
        # Filtering for capitalized words or words longer than 5 chars
        words = re.findall(r'\b[A-Za-z]{5,}\b', text)
        
        # Stop words to filter
        stop_words = {"presentation", "information", "details", "analysis", "summary", "overview", "context"}
        
        meaningful = []
        for w in words:
            if w.lower() not in stop_words:
                meaningful.append(w)
        
        # Return top 3 unique meaningful words
        seen = set()
        result = []
        for w in meaningful:
            if w.lower() not in seen:
                result.append(w)
                seen.add(w.lower())
            if len(result) >= 3:
                break
        
        return result
