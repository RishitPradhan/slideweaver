"""
Image Extractor Module
======================
Extracts embedded images (charts, diagrams, figures) from PDF documents
using PyMuPDF (fitz). Saves images to a temporary directory and returns
metadata for downstream slide integration.
"""

import os
import uuid
import tempfile
from typing import List, Dict, Any, Optional

try:
    import fitz  # PyMuPDF
    HAS_FITZ = True
except ImportError:
    HAS_FITZ = False


# Minimum image dimensions (skip tiny icons / artifacts)
MIN_WIDTH = 50
MIN_HEIGHT = 50
# Minimum file size in bytes (skip trivial images)
MIN_BYTES = 2000


class ImageExtractor:
    """
    Extracts images from PDF files using PyMuPDF.

    Returns a list of dicts, each containing:
        - path:   absolute path to the extracted image file
        - page:   0-based page number the image came from
        - width:  pixel width
        - height: pixel height
        - index:  sequential index of the image
    """

    def __init__(self, output_dir: Optional[str] = None):
        """
        Args:
            output_dir: Directory to save extracted images.
                        Defaults to a temp directory under data/images/.
        """
        if output_dir:
            self.output_dir = output_dir
        else:
            self.output_dir = os.path.join(
                tempfile.gettempdir(), "slideweaver_images"
            )
        os.makedirs(self.output_dir, exist_ok=True)

    def extract_from_path(self, pdf_path: str) -> List[Dict[str, Any]]:
        """Extract images from a PDF file on disk."""
        if not HAS_FITZ:
            print("[ImageExtractor] PyMuPDF not installed. Skipping image extraction.")
            return []

        if not os.path.exists(pdf_path):
            return []

        try:
            doc = fitz.open(pdf_path)
        except Exception as e:
            print(f"[ImageExtractor] Failed to open PDF: {e}")
            return []

        images = []
        img_index = 0

        for page_num in range(len(doc)):
            page = doc[page_num]
            image_list = page.get_images(full=True)

            for img_info in image_list:
                xref = img_info[0]

                try:
                    base_image = doc.extract_image(xref)
                except Exception:
                    continue

                if not base_image:
                    continue

                img_bytes = base_image.get("image")
                img_ext = base_image.get("ext", "png")
                width = base_image.get("width", 0)
                height = base_image.get("height", 0)

                # Skip tiny images (icons, bullets, etc.)
                if width < MIN_WIDTH or height < MIN_HEIGHT:
                    continue

                # Skip trivially small files
                if not img_bytes or len(img_bytes) < MIN_BYTES:
                    continue

                # Save image to disk
                img_id = str(uuid.uuid4())[:8]
                filename = f"img_{img_id}_p{page_num}.{img_ext}"
                img_path = os.path.join(self.output_dir, filename)

                try:
                    with open(img_path, "wb") as f:
                        f.write(img_bytes)
                except Exception:
                    continue

                images.append({
                    "path": img_path,
                    "page": page_num,
                    "width": width,
                    "height": height,
                    "index": img_index,
                    "ext": img_ext,
                })
                img_index += 1

        doc.close()
        print(f"[ImageExtractor] Extracted {len(images)} images from {len(doc)} pages")
        return images

    def extract_from_bytes(self, content: bytes) -> List[Dict[str, Any]]:
        """Extract images from PDF bytes (for uploaded files)."""
        if not HAS_FITZ:
            return []

        # Write to temp file, extract, then clean up the temp PDF
        tmp_path = os.path.join(
            tempfile.gettempdir(),
            f"slideweaver_tmp_{uuid.uuid4().hex[:8]}.pdf"
        )

        try:
            with open(tmp_path, "wb") as f:
                f.write(content)
            return self.extract_from_path(tmp_path)
        finally:
            if os.path.exists(tmp_path):
                try:
                    os.unlink(tmp_path)
                except Exception:
                    pass

    def cleanup(self):
        """Remove all extracted images from the output directory."""
        if os.path.exists(self.output_dir):
            for f in os.listdir(self.output_dir):
                fp = os.path.join(self.output_dir, f)
                if os.path.isfile(fp):
                    try:
                        os.unlink(fp)
                    except Exception:
                        pass
