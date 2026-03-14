import sys
import os

# Add the project root to the sys.path so we can import from backend
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

# Import the FastAPI app from backend.main
from backend.main import app

# Vercel needs the app variable to be exposed
# This file acts as the entry point for Vercel's Python runtime
