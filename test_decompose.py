import requests
import json

url = "http://localhost:5001/api/v1/ppt/files/decompose"
payload = {
    "file_paths": [
        "c:/Users/Administrator/Desktop/IIIT Bhu/slideweaver-try/servers/fastapi/tmp/slideweaver/10d98b6f-af2e-4f1c-8653-4adae96e5694/UnderGridai.pdf"
    ]
}
headers = {"Content-Type": "application/json"}

try:
    response = requests.post(url, json=payload, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Error: {e}")
