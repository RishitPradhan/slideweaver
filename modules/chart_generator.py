"""
Chart Generator Module
======================
Generates Bar, Line, and Pie charts using matplotlib.
Styled to match the Hawkins National Laboratory (Stranger Things) theme:
- Dark background
- Neon cyan and red accents
- Consolas/Courier fonts
"""

import os
import uuid
import tempfile
import matplotlib
matplotlib.use('Agg')  # Headless backend
import matplotlib.pyplot as plt
import matplotlib as mpl
from typing import Dict, Any, List

# Hawkins Theme Colors
HAWKINS_BG = "#0B0C10"      # Very dark
HAWKINS_RED = "#FF0000"     # Neon red
HAWKINS_CYAN = "#00FFFF"    # Neon cyan
HAWKINS_TEXT = "#C0C0C0"    # Light gray
HAWKINS_ACCENT = "#1F2833"  # Dark blue-gray

class ChartGenerator:
    """
    Generates PNG chart images for PowerPoint slides.
    """

    def __init__(self, output_dir: str = None):
        self.output_dir = output_dir or os.path.join(tempfile.gettempdir(), "slideweaver_charts")
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Configure mathtext/font if possible, otherwise use defaults
        mpl.rcParams['text.color'] = HAWKINS_TEXT
        mpl.rcParams['axes.labelcolor'] = HAWKINS_TEXT
        mpl.rcParams['xtick.color'] = HAWKINS_TEXT
        mpl.rcParams['ytick.color'] = HAWKINS_TEXT
        mpl.rcParams['font.family'] = 'monospace'

    def generate_chart(self, chart_type: str, data: Dict[str, Any], title: str = "") -> str:
        """
        Generate a chart and return the absolute path to the PNG file.
        """
        plt.style.use('dark_background')
        fig, ax = plt.subplots(figsize=(8, 6), facecolor=HAWKINS_BG)
        ax.set_facecolor(HAWKINS_BG)
        
        labels = data.get("labels", [])
        values = data.get("values", [])
        unit = data.get("unit", "")

        if chart_type == "line":
            ax.plot(labels, values, color=HAWKINS_RED, marker='o', linewidth=3, markersize=8, markerfacecolor=HAWKINS_CYAN)
            ax.set_ylabel(unit)
            
        elif chart_type == "pie":
            wedges, texts, autotexts = ax.pie(
                values, labels=labels, autopct='%1.1f%%',
                colors=[HAWKINS_RED, HAWKINS_CYAN, "#FF4500", "#00CED1"],
                startangle=140, textprops={'color': HAWKINS_TEXT}
            )
            for autotext in autotexts:
                autotext.set_color('white')
                autotext.set_weight('bold')

        else:  # bar chart
            bars = ax.bar(labels, values, color=HAWKINS_CYAN, edgecolor=HAWKINS_RED, linewidth=1.5)
            ax.set_ylabel(unit)
            # Add value labels on top of bars
            for bar in bars:
                height = bar.get_height()
                ax.text(bar.get_x() + bar.get_width()/2., height + (max(values)*0.01),
                        f'{height}{unit}', ha='center', va='bottom', color=HAWKINS_CYAN)

        # Remove spines for a cleaner "HUD" look
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.spines['left'].set_color(HAWKINS_ACCENT)
        ax.spines['bottom'].set_color(HAWKINS_ACCENT)

        ax.set_title(title.upper(), color=HAWKINS_RED, fontsize=16, fontweight='bold', pad=20)
        
        plt.tight_layout()
        
        chart_id = str(uuid.uuid4())[:8]
        filename = f"chart_{chart_id}.png"
        filepath = os.path.join(self.output_dir, filename)
        
        fig.savefig(filepath, dpi=120, facecolor=HAWKINS_BG)
        plt.close(fig)
        
        return filepath

    def cleanup(self):
        """Clean up generated chart files."""
        if os.path.exists(self.output_dir):
            import shutil
            shutil.rmtree(self.output_dir)
            os.makedirs(self.output_dir)
