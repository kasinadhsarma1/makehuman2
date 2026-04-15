"""
Backend configuration for MakeHuman2 FastAPI server.

Values are read from environment variables with sane defaults.
"""
from __future__ import annotations

import os
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Server
    host: str = Field(default="127.0.0.1", alias="MH2_HOST")
    port: int = Field(default=8000, alias="MH2_PORT")
    debug: bool = Field(default=False, alias="MH2_DEBUG")
    reload: bool = Field(default=False, alias="MH2_RELOAD")
    workers: int = Field(default=1, alias="MH2_WORKERS")

    # API
    api_prefix: str = Field(default="/api/v1", alias="MH2_API_PREFIX")
    app_title: str = "MakeHuman2 API"
    app_description: str = (
        "REST API for MakeHuman2 — parametric 3D human character creation tool."
    )
    app_version: str = "2.0.1"

    # CORS — allow the Electron frontend and common dev ports by default
    cors_origins: List[str] = Field(
        default=[
            "http://localhost:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3000",
            "app://.",           # Electron production origin
        ],
        alias="MH2_CORS_ORIGINS",
    )

    # MakeHuman
    default_base_mesh: str = Field(default="hm08", alias="MH2_BASE_MESH")

    # SQLite asset cache location (empty = default user dir)
    db_path: str = Field(default="", alias="MH2_DB_PATH")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        populate_by_name = True


settings = Settings()
