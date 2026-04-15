"""
Info / health router.

Endpoints:
  GET  /health                 → liveness probe
  GET  /info                   → application info
  GET  /info/config            → current configuration
  GET  /info/opengl            → OpenGL capability info (if available)
"""
from __future__ import annotations

import platform
import sys
from typing import Any, Dict

from fastapi import APIRouter

from ..utils.file_helpers import DATA_DIR, user_home_dir

router = APIRouter(tags=["info"])

_VERSION = "2.0.1"


@router.get("/health", summary="Liveness probe")
def health() -> Dict[str, str]:
    return {"status": "ok", "version": _VERSION}


@router.get("/info", summary="Application and environment information")
def app_info() -> Dict[str, Any]:
    return {
        "application": "MakeHuman2",
        "version": _VERSION,
        "python": sys.version,
        "platform": platform.platform(),
        "data_dir": str(DATA_DIR),
        "user_dir": str(user_home_dir()),
        "data_dir_exists": DATA_DIR.exists(),
    }


@router.get("/info/config", summary="Backend configuration values")
def get_config() -> Dict[str, Any]:
    from ..config import settings
    return {
        "host": settings.host,
        "port": settings.port,
        "debug": settings.debug,
        "cors_origins": settings.cors_origins,
        "base_mesh": settings.default_base_mesh,
        "api_prefix": settings.api_prefix,
    }
