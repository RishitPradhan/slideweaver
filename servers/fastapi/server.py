import uvicorn
import argparse
from dotenv import load_dotenv
import os
import sys
import traceback

load_dotenv()

def log_error(exc_type, exc_value, exc_traceback):
    print("CRITICAL: Captured global exception!")
    traceback.print_exception(exc_type, exc_value, exc_traceback)
    with open("crash_log.txt", "w") as f:
        traceback.print_exception(exc_type, exc_value, exc_traceback, file=f)

sys.excepthook = log_error

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run the FastAPI server")
    parser.add_argument(
        "--port", type=int, required=True, help="Port number to run the server on"
    )
    parser.add_argument(
        "--reload", type=str, default="false", help="Reload the server on code changes"
    )
    args = parser.parse_args()
    reload = args.reload == "true"
    
    try:
        from api.main import app

        uvicorn.run(
            "api.main:app",
            host="0.0.0.0",
            port=args.port,
            log_level="info",
            reload=reload,
        )
    except Exception as e:
        print(f"Error during server startup: {e}")
        sys.exit(1)
