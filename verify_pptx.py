import sys, os
sys.path.append("c:/Users/Administrator/Desktop/backup iiit/slideweaver")
from modules.pptx_builder import PptxBuilder
from modules.theme_engine import THEME_PRESETS

try:
    print("Testing PptxBuilder...")
    builder = PptxBuilder(output_dir="slides", theme_name="hawkins_dark")
    test_data = {
        "title": "Verification Test",
        "subtitle": "Fixed NameError",
        "slides": [
            {"type": "title", "title": "Verification", "subtitle": "System Check"},
            {"type": "bullet_points", "title": "Status", "bullet_points": ["Backend: Online", "Theme: Red", "Fix: Applied"]},
        ],
    }
    fp = builder.build(test_data)
    print(f"Success! PPTX saved at: {fp}")
    if os.path.exists(fp):
        print(f"File Size: {os.path.getsize(fp)} bytes")
except Exception as e:
    print(f"Error during verification: {e}")
    import traceback
    traceback.print_exc()
