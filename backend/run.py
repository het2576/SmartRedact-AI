"""Dev entrypoint: `python run.py` starts the API with auto-reload.

(Not named app.py - that would collide with the `app/` package next to it.)
For production, run `uvicorn app.main:app --host 0.0.0.0 --port 8000` directly.
"""

import uvicorn

from app.config import settings

if __name__ == "__main__":
    print("Starting Blacken API")
    print(f"Server: http://{settings.host}:{settings.port}")
    print(f"Docs:   http://{settings.host}:{settings.port}/api/docs")
    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=True)
