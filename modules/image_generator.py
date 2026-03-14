"""
Image Generator Module
Adapted from presenton: ImageGenerationService

Generates images for slides using Stability AI, Pexels, or Pixabay.
Falls back to placeholder images when no generator is available.
"""

import os
import uuid
import random
import re
import requests
from typing import Optional


# API keys will be fetched via os.getenv within the class for robustness


class ImageGenerator:
    """
    AI image generation service with multiple provider fallbacks.
    Priority: Stability AI → Pexels → Pixabay → Placeholder
    """

    def __init__(self, output_dir: str = "slides/images"):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)
        # Refresh configuration from environment
        self.stability_key = os.getenv("STABILITY_API_KEY", "")
        self.pexels_key = os.getenv("PEXELS_API_KEY", "")
        self.pixabay_key = os.getenv("PIXABAY_API_KEY", "")
        # Track used image URLs to prevent duplicates
        self._used_urls = set()

    def _extract_keywords(self, prompt: str) -> str:
        """Extract meaningful keywords from a prompt for better image search."""
        # Remove common filler words to get better search results
        stop_words = {
            'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
            'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
            'as', 'into', 'through', 'during', 'before', 'after', 'above',
            'below', 'between', 'out', 'off', 'over', 'under', 'again',
            'further', 'then', 'once', 'and', 'but', 'or', 'nor', 'not', 'so',
            'yet', 'both', 'each', 'few', 'more', 'most', 'other', 'some',
            'such', 'no', 'only', 'own', 'same', 'than', 'too', 'very',
            'just', 'because', 'about', 'that', 'this', 'these', 'those',
            'it', 'its', 'related', 'professional', 'photo', 'image',
            'showing', 'depicting', 'illustration', 'visual',
        }
        # Remove punctuation and split
        clean = re.sub(r'[^\w\s]', ' ', prompt.lower())
        words = [w for w in clean.split() if w not in stop_words and len(w) > 2]
        # Take up to 4 unique meaningful words
        seen = set()
        keywords = []
        for w in words:
            if w not in seen:
                seen.add(w)
                keywords.append(w)
            if len(keywords) >= 4:
                break
        return ' '.join(keywords) if keywords else prompt.split()[0]

    def generate_image(self, prompt: str) -> Optional[str]:
        """
        Generate or fetch an image for a slide.
        Returns the path to the saved image file (forward-slash normalized).
        """
        print(f"[ImageGenerator] Generating image for: {prompt[:80]}...")

        # 1. Try Stability AI (AI Generation)
        if self.stability_key:
            path = self._from_stability_ai(prompt)
            if path:
                return path

        # 2. Try Pexels stock photos
        if self.pexels_key:
            path = self._from_pexels(prompt)
            if path:
                return path

        # 3. Try Pixabay stock photos
        if self.pixabay_key:
            path = self._from_pixabay(prompt)
            if path:
                return path

        # 4. Fallback: generate a placeholder
        print("[ImageGenerator] All providers failed, creating placeholder")
        return self._create_placeholder(prompt)

    def _normalize_path(self, filepath: str) -> str:
        """Normalize Windows backslashes to forward slashes."""
        return filepath.replace("\\", "/")

    def _from_stability_ai(self, prompt: str) -> Optional[str]:
        """Generate an image using Stability.ai API (SD3 core)."""
        try:
            print("[ImageGenerator] Trying Stability AI...")
            response = requests.post(
                "https://api.stability.ai/v2beta/stable-image/generate/core",
                headers={
                    "authorization": f"Bearer {self.stability_key}",
                    "accept": "image/*",
                },
                files={"none": ""},
                data={
                    "prompt": prompt,
                    "output_format": "jpeg",
                },
                timeout=30,
            )

            if response.status_code == 200:
                filename = f"stability_{uuid.uuid4().hex[:8]}.jpg"
                filepath = os.path.join(self.output_dir, filename)
                with open(filepath, "wb") as f:
                    f.write(response.content)
                print(f"[ImageGenerator] Stability AI image saved: {filename} ({len(response.content)} bytes)")
                return self._normalize_path(filepath)
            else:
                try:
                    err = response.json()
                except Exception:
                    err = response.text[:200]
                print(f"[ImageGenerator] Stability AI error ({response.status_code}): {err}")
                return None
        except Exception as e:
            print(f"[ImageGenerator] Stability AI exception: {e}")
            return None

    def _from_pexels(self, query: str) -> Optional[str]:
        """Fetch a stock photo from Pexels API."""
        try:
            search_query = self._extract_keywords(query)
            print(f"[ImageGenerator] Trying Pexels: '{search_query}'...")
            response = requests.get(
                "https://api.pexels.com/v1/search",
                headers={"Authorization": self.pexels_key},
                params={"query": search_query, "per_page": 5, "orientation": "landscape"},
                timeout=10,
            )
            if response.status_code == 200:
                data = response.json()
                photos = data.get("photos", [])
                if photos:
                    # Filter out already-used image URLs
                    available = [p for p in photos if p["src"]["large"] not in self._used_urls]
                    if not available:
                        available = photos  # If all used, allow repeats
                    chosen = random.choice(available)
                    img_url = chosen["src"]["large"]
                    self._used_urls.add(img_url)
                    return self._download_image(img_url, "pexels")
                else:
                    print("[ImageGenerator] Pexels returned no photos")
            else:
                print(f"[ImageGenerator] Pexels error: {response.status_code}")
        except Exception as e:
            print(f"[ImageGenerator] Pexels exception: {e}")
        return None

    def _from_pixabay(self, query: str) -> Optional[str]:
        """Fetch a stock photo from Pixabay API."""
        try:
            search_query = self._extract_keywords(query)
            print(f"[ImageGenerator] Trying Pixabay: '{search_query}'...")
            response = requests.get(
                "https://pixabay.com/api/",
                params={
                    "key": self.pixabay_key,
                    "q": search_query,
                    "per_page": 5,
                    "image_type": "photo",
                    "orientation": "horizontal",
                },
                timeout=10,
            )
            if response.status_code == 200:
                data = response.json()
                hits = data.get("hits", [])
                if hits:
                    available = [h for h in hits if h["largeImageURL"] not in self._used_urls]
                    if not available:
                        available = hits
                    chosen = random.choice(available)
                    img_url = chosen["largeImageURL"]
                    self._used_urls.add(img_url)
                    return self._download_image(img_url, "pixabay")
                else:
                    print("[ImageGenerator] Pixabay returned no hits")
            else:
                print(f"[ImageGenerator] Pixabay error: {response.status_code}")
        except Exception as e:
            print(f"[ImageGenerator] Pixabay exception: {e}")
        return None

    def _download_image(self, url: str, source: str) -> Optional[str]:
        """Download image from URL and save locally."""
        try:
            response = requests.get(url, timeout=15)
            if response.status_code == 200:
                filename = f"{source}_{uuid.uuid4().hex[:8]}.jpg"
                filepath = os.path.join(self.output_dir, filename)
                with open(filepath, "wb") as f:
                    f.write(response.content)
                print(f"[ImageGenerator] Downloaded {source} image: {filename} ({len(response.content)} bytes)")
                return self._normalize_path(filepath)
        except Exception as e:
            print(f"[ImageGenerator] Download error: {e}")
        return None

    def _create_placeholder(self, prompt: str) -> Optional[str]:
        """Create a simple placeholder image using Pillow."""
        try:
            from PIL import Image, ImageDraw, ImageFont

            img = Image.new("RGB", (1280, 720), color=(11, 12, 16))
            draw = ImageDraw.Draw(img)

            # Draw border
            draw.rectangle([20, 20, 1260, 700], outline=(0, 255, 255), width=2)

            # Draw text
            short_prompt = prompt[:60] + "..." if len(prompt) > 60 else prompt
            try:
                font = ImageFont.truetype("arial.ttf", 24)
            except Exception:
                font = ImageFont.load_default()

            # Center text
            bbox = draw.textbbox((0, 0), short_prompt, font=font)
            tw = bbox[2] - bbox[0]
            x = (1280 - tw) // 2
            draw.text((x, 340), short_prompt, fill=(0, 255, 255), font=font)

            # Label
            draw.text((40, 660), "[ AI IMAGE PLACEHOLDER ]", fill=(255, 42, 42), font=font)

            filename = f"placeholder_{uuid.uuid4().hex[:8]}.png"
            filepath = os.path.join(self.output_dir, filename)
            img.save(filepath)
            print(f"[ImageGenerator] Created placeholder: {filename}")
            return self._normalize_path(filepath)
        except Exception as e:
            print(f"[ImageGenerator] Placeholder error: {e}")
            return None


def process_slides_images(slides: list, output_dir: str = "slides/images") -> list:
    """
    Process all slides and generate images for those with __image_prompt__.
    Returns updated slides list with __image_path__ set.
    """
    generator = ImageGenerator(output_dir=output_dir)

    prompts_found = [s.get("__image_prompt__") for s in slides if "__image_prompt__" in s]
    print(f"[process_slides_images] Found {len(prompts_found)} slides with __image_prompt__")

    for slide in slides:
        if "__image_prompt__" in slide:
            prompt = slide["__image_prompt__"]
            print(f"[process_slides_images] Generating image for slide '{slide.get('title', '?')}'")
            image_path = generator.generate_image(prompt)
            if image_path:
                slide["__image_path__"] = image_path
                print(f"[process_slides_images] -> __image_path__ = {image_path}")
            else:
                print(f"[process_slides_images] -> Image generation returned None")
            # Remove the prompt to keep data clean
            del slide["__image_prompt__"]

    return slides
