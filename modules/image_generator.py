"""
Image Generator Module
======================
Generates conceptual images using Dynapictures API.
Uses Gemini to refine the visual prompt based on slide content.
"""

import os
import requests
import uuid
import tempfile
from typing import Optional, Dict, Any

class ImageGenerator:
    """
    Integrates with Dynapictures API to generate conceptual illustrations.
    """

    def __init__(self, api_key: str, template_uid: Optional[str] = None, output_dir: str = None):
        self.api_key = api_key
        self.template_uid = template_uid
        self.output_dir = output_dir or os.path.join(tempfile.gettempdir(), "slideweaver_ai_images")
        os.makedirs(self.output_dir, exist_ok=True)
        self.base_url = "https://api.dynapictures.com/designs"

    def generate_image(self, prompt: str, title: str = "") -> Optional[str]:
        """
        Generate an image via Dynapictures and return the local path.
        If no template_uid is provided, it attempts to use a default or 
        logs that one is required for template-based generation.
        """
        if not self.template_uid:
            # Dynapictures requires a template UID for generation via /designs endpoint.
            # In a production scenario, we'd have a default conceptual template.
            print("[ImageGenerator] No Template UID provided. Dynapictures requires a template.")
            return None

        url = f"{self.base_url}/{self.template_uid}"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        # We assume the template has a layer named 'text' or 'prompt' for the AI generator
        # or just 'text1' for a background text element.
        payload = {
            "params": [
                {"name": "text1", "text": title},
                {"name": "prompt", "text": prompt} # Custom layer for AI prompt if template supports it
            ]
        }

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            image_url = data.get("imageUrl")
            if not image_url:
                print(f"[ImageGenerator] No imageUrl in response: {data}")
                return None
            
            # Download the image
            img_response = requests.get(image_url, timeout=20)
            img_response.raise_for_status()
            
            filename = f"ai_img_{str(uuid.uuid4())[:8]}.png"
            filepath = os.path.join(self.output_dir, filename)
            
            with open(filepath, "wb") as f:
                f.write(img_response.content)
            
            return filepath

        except Exception as e:
            print(f"[ImageGenerator] Error generating image: {e}")
            return None

    def cleanup(self):
        """Clean up generated image files."""
        if os.path.exists(self.output_dir):
            import shutil
            shutil.rmtree(self.output_dir)
            os.makedirs(self.output_dir)
