"""End-to-end test of the slideweaver pipeline."""
import sys, os, traceback
sys.path.append("c:/Users/Administrator/Desktop/backup iiit/slideweaver")
from dotenv import load_dotenv
load_dotenv("c:/Users/Administrator/Desktop/backup iiit/slideweaver/.env")

# Test 1: Gemini slide generation
print("=== TEST 1: Gemini Slide Generation ===")
from modules.gemini_client import GeminiClient
gc = GeminiClient()
print("Gemini available:", gc.is_available())
try:
    result = gc.generate_outline(
        "Climate Change",
        ["Global warming is a major concern. CO2 levels are rising rapidly."],
        num_slides=3,
        include_images=True,
    )
    slides = result.get("slides", [])
    print("Slides generated:", len(slides))
    for s in slides:
        stype = s.get("type", "?")
        stitle = s.get("title", "")[:50]
        print("  -", stype, ":", stitle)
        if "__image_prompt__" in s:
            print("    IMAGE PROMPT:", s["__image_prompt__"][:60])
except Exception as e:
    traceback.print_exc()
    print("ERROR:", e)

# Test 2: Image generation (Stability AI)
print()
print("=== TEST 2: Image Generation (Stability AI) ===")
from modules.image_generator import ImageGenerator, STABILITY_API_KEY, PEXELS_API_KEY
print("STABILITY_API_KEY set:", bool(STABILITY_API_KEY))
print("PEXELS_API_KEY set:", bool(PEXELS_API_KEY))
ig = ImageGenerator(output_dir="slides/images")
try:
    path = ig.generate_image("A sunset over ocean waves")
    print("Image path:", path)
    if path:
        print("File exists:", os.path.exists(path))
        if os.path.exists(path):
            print("File size:", os.path.getsize(path), "bytes")
except Exception as e:
    traceback.print_exc()
    print("ERROR:", e)

# Test 3: PPTX Builder
print()
print("=== TEST 3: PPTX Builder ===")
from modules.pptx_builder import PptxBuilder
try:
    builder = PptxBuilder(output_dir="slides", theme_name="hawkins_dark")
    test_data = {
        "title": "Test Presentation",
        "subtitle": "Testing All Features",
        "slides": [
            {"type": "title", "title": "Climate Change", "subtitle": "A Global Challenge"},
            {"type": "bullet_points", "title": "Key Findings", "bullet_points": ["Point 1", "Point 2", "Point 3"]},
            {"type": "content", "title": "Analysis", "content": "Lorem ipsum dolor sit amet."},
        ],
    }
    fp = builder.build(test_data)
    print("PPTX saved:", fp)
    print("File exists:", os.path.exists(fp))
    print("File size:", os.path.getsize(fp), "bytes")
except Exception as e:
    traceback.print_exc()
    print("ERROR:", e)

# Test 4: Full pipeline with image slide
print()
print("=== TEST 4: Full Pipeline with Image ===")
from modules.image_generator import process_slides_images
try:
    test_slides = [
        {"type": "title", "title": "Test", "subtitle": "Sub"},
        {"type": "bullet_points", "title": "Points", "bullet_points": ["A", "B"], "__image_prompt__": "A futuristic city skyline"},
    ]
    processed = process_slides_images(test_slides, output_dir="slides/images")
    for s in processed:
        print("  Slide:", s.get("type"), "| has image_path:", "__image_path__" in s)
        if "__image_path__" in s:
            print("    path:", s["__image_path__"])
            print("    exists:", os.path.exists(s["__image_path__"]))
except Exception as e:
    traceback.print_exc()
    print("ERROR:", e)

print()
print("=== ALL TESTS COMPLETE ===")
