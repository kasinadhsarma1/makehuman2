"""
Allow running with:  python -m backend
"""
import uvicorn
from .config import settings

if __name__ == "__main__":
    uvicorn.run(
        "backend.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
        workers=settings.workers if not settings.reload else 1,
        log_level="debug" if settings.debug else "info",
    )
