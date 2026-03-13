import asyncio
import os
from dotenv import load_dotenv

load_dotenv()

from services.image_generation_service import ImageGenerationService
from models.image_prompt import ImagePrompt
from utils.asset_directory_utils import get_images_directory

async def main():
    service = ImageGenerationService(get_images_directory())
    print(f"Is image generation disabled? {service.is_image_generation_disabled}")
    print(f"Image gen func: {service.image_gen_func}")
    # Force test get_image_from_pexels if available
    
    prompt = ImagePrompt(prompt="business people analyzing charts", theme_prompt="blue and modern")
    print(f"Testing generation...")
    result = await service.generate_image(prompt)
    print(f"Resulting image asset or URL: {result}")
    
    # Check if stock provider is selected
    print(f"Is stock provider selected? {service.is_stock_provider_selected()}")

if __name__ == "__main__":
    asyncio.run(main())
