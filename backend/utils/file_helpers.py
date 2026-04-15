"""
File I/O utilities for the MakeHuman2 backend.

Mirrors core/filehelper.py and core/environ.py path resolution.
"""
from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

# ---------------------------------------------------------------------------
# Root paths
# ---------------------------------------------------------------------------

# Repo root: backend/ sits one level inside the repo
_BACKEND_DIR = Path(__file__).resolve().parent.parent
REPO_ROOT = _BACKEND_DIR.parent
DATA_DIR = REPO_ROOT / "data"


def get_data_dir() -> Path:
    return DATA_DIR


def get_base_mesh_dir(base_name: str = "hm08") -> Path:
    return DATA_DIR / "base" / base_name


def get_target_dir() -> Path:
    return DATA_DIR / "target"


def get_shaders_dir() -> Path:
    return DATA_DIR / "shaders"


def user_home_dir() -> Path:
    """Return the MakeHuman2 user data directory."""
    xdg = os.environ.get("XDG_CONFIG_HOME")
    if xdg:
        base = Path(xdg)
    else:
        base = Path.home() / ".config"
    return base / "makehuman2"


def user_models_dir() -> Path:
    return user_home_dir() / "models"


def user_db_dir() -> Path:
    return user_home_dir() / "dbcache"


# ---------------------------------------------------------------------------
# JSON helpers
# ---------------------------------------------------------------------------

class FileHelpers:
    """Static helpers for common file operations."""

    @staticmethod
    def read_json(path: str | Path) -> Dict[str, Any]:
        """Read and parse a JSON file, raising FileNotFoundError if missing."""
        p = Path(path)
        if not p.exists():
            raise FileNotFoundError(f"File not found: {p}")
        with p.open("r", encoding="utf-8") as fh:
            return json.load(fh)

    @staticmethod
    def write_json(path: str | Path, data: Dict[str, Any], indent: int = 2) -> None:
        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        with p.open("w", encoding="utf-8") as fh:
            json.dump(data, fh, indent=indent)

    @staticmethod
    def ensure_dir(path: str | Path) -> Path:
        p = Path(path)
        p.mkdir(parents=True, exist_ok=True)
        return p

    @staticmethod
    def list_files(directory: str | Path, extension: str = "") -> List[Path]:
        """Recursively list files, optionally filtered by extension."""
        d = Path(directory)
        if not d.exists():
            return []
        pattern = f"**/*{extension}" if extension else "**/*"
        return sorted(p for p in d.glob(pattern) if p.is_file())

    @staticmethod
    def resolve_asset_path(
        relative_or_absolute: str,
        base_mesh: str = "hm08",
        asset_type: str = "clothes",
    ) -> Optional[Path]:
        """
        Resolve an asset path, searching system data dir then user home dir.
        Returns the first existing path or None.
        """
        candidate = Path(relative_or_absolute)
        if candidate.is_absolute() and candidate.exists():
            return candidate

        search_dirs = [
            DATA_DIR / asset_type / base_mesh,
            DATA_DIR / asset_type,
            user_home_dir() / asset_type / base_mesh,
            user_home_dir() / asset_type,
        ]
        for d in search_dirs:
            p = d / relative_or_absolute
            if p.exists():
                return p
        return None

    @staticmethod
    def thumbnail_path(asset_path: str | Path) -> Optional[Path]:
        """Return the thumbnail PNG path for an asset file if it exists."""
        p = Path(asset_path)
        for ext in (".thumb.png", ".png"):
            thumb = p.with_suffix(ext)
            if thumb.exists():
                return thumb
        return None

    @staticmethod
    def encode_thumbnail(path: Optional[Path]) -> Optional[str]:
        """Base64-encode a thumbnail file for API transport."""
        if path is None or not path.exists():
            return None
        import base64
        with open(path, "rb") as fh:
            return base64.b64encode(fh.read()).decode("ascii")

    @staticmethod
    def mhmat_to_dict(path: str | Path) -> Dict[str, Any]:
        """
        Parse a MakeHuman material (.mhmat) file into a dict.

        .mhmat is a custom key-value text format, not JSON.
        """
        result: Dict[str, Any] = {}
        p = Path(path)
        if not p.exists():
            return result
        with p.open("r", encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                parts = line.split(None, 1)
                if len(parts) == 2:
                    key, value = parts
                    # Try numeric coercion
                    result[key] = _coerce(value)
        return result


def _coerce(value: str) -> Any:
    """Try to convert a string to bool / int / float / list-of-floats."""
    low = value.lower()
    if low in ("true", "yes"):
        return True
    if low in ("false", "no"):
        return False
    try:
        return int(value)
    except ValueError:
        pass
    try:
        return float(value)
    except ValueError:
        pass
    # Try space-separated float vector
    parts = value.split()
    if len(parts) > 1:
        try:
            return [float(x) for x in parts]
        except ValueError:
            pass
    return value
