"""
MakeHuman2 FastAPI Backend
==========================

Entry point for the REST API server.

Usage:
    # From repo root
    cd makehuman2
    source venv/bin/activate
    uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload

    # Or via the helper script:
    python -m backend

Interactive API docs:
    http://127.0.0.1:8000/api/v1/docs
    http://127.0.0.1:8000/api/v1/redoc
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .routers import (
    assets_router,
    character_router,
    export_router,
    info_router,
    materials_router,
    mesh_router,
    morphs_router,
    skeleton_router,
)
from .services.cache_service import CacheService
from .services.morph_service import MorphService

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lifespan — startup / shutdown
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # --- Startup ---
    logger.info("MakeHuman2 API starting up …")

    # Initialise the SQLite asset cache
    db_path = settings.db_path or None
    CacheService.init(db_path)

    # Load morph target catalogue (non-blocking — logs a warning if missing)
    morph_count = MorphService.load_target_repository(settings.default_base_mesh)
    logger.info("Morph targets loaded: %d", morph_count)

    yield

    # --- Shutdown ---
    logger.info("MakeHuman2 API shutting down …")
    CacheService.close()


# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------

app = FastAPI(
    title=settings.app_title,
    description=settings.app_description,
    version=settings.app_version,
    docs_url=f"{settings.api_prefix}/docs",
    redoc_url=f"{settings.api_prefix}/redoc",
    openapi_url=f"{settings.api_prefix}/openapi.json",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Global exception handler
# ---------------------------------------------------------------------------

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error on %s %s", request.method, request.url)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {type(exc).__name__}: {exc}"},
    )


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------

PREFIX = settings.api_prefix

app.include_router(info_router,      prefix=PREFIX)
app.include_router(character_router, prefix=PREFIX)
app.include_router(morphs_router,    prefix=PREFIX)
app.include_router(assets_router,    prefix=PREFIX)
app.include_router(skeleton_router,  prefix=PREFIX)
app.include_router(export_router,    prefix=PREFIX)
app.include_router(materials_router, prefix=PREFIX)
app.include_router(mesh_router,      prefix=PREFIX)


# ---------------------------------------------------------------------------
# Root redirect
# ---------------------------------------------------------------------------

@app.get("/", include_in_schema=False)
async def root() -> JSONResponse:
    return JSONResponse({
        "message": "MakeHuman2 API",
        "version": settings.app_version,
        "docs": f"{settings.api_prefix}/docs",
    })
