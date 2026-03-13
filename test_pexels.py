import os
import requests
from dotenv import load_dotenv

load_dotenv()
key = os.getenv("PEXELS_API_KEY")
print(f"Key preview: {key[:10]}...{key[-5:]}" if key else "NO KEY")

try:
    res = requests.get(
        "https://api.pexels.com/v1/search",
        headers={"Authorization": key},
        params={"query": "medical technology", "per_page": 1},
        timeout=10
    )
    print(f"Status Code: {res.status_code}")
    if res.status_code == 200:
        data = res.json()
        if data.get("photos"):
            print("Found photo:", data["photos"][0]["src"]["large"])
        else:
            print("No photos found in response data")
    else:
        print("Error response:", res.text)
except Exception as e:
    print("Exception:", e)
