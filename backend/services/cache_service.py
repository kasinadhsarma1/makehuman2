"""
Asset cache service — SQLite-backed inventory of all available assets.

Mirrors core/sql_cache.py and core/globenv.py asset discovery logic.
"""
from __future__ import annotations

import hashlib
import json
import logging
import sqlite3
from pathlib import Path
from typing import Any, Dict, List, Optional

from ..utils.file_helpers import (
    DATA_DIR,
    FileHelpers,
    get_base_mesh_dir,
    user_home_dir,
)

logger = logging.getLogger(__name__)

_DB_SCHEMA = """
CREATE TABLE IF NOT EXISTS assets (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid        TEXT,
    name        TEXT NOT NULL,
    asset_type  TEXT NOT NULL,
    file_path   TEXT NOT NULL UNIQUE,
    base_mesh   TEXT NOT NULL DEFAULT 'hm08',
    tags        TEXT DEFAULT '[]',
    license     TEXT,
    author      TEXT,
    description TEXT DEFAULT '',
    thumbnail   TEXT,
    material_file TEXT,
    is_system   INTEGER DEFAULT 1,
    hash        TEXT
);

CREATE INDEX IF NOT EXISTS idx_asset_type ON assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_base_mesh  ON assets(base_mesh);
CREATE INDEX IF NOT EXISTS idx_name       ON assets(name);
"""

# Map asset_type → (data sub-dir, file extensions)
_ASSET_DIRS: Dict[str, tuple] = {
    "clothes":   ("clothes",   (".mhclo",)),
    "hair":      ("hair",      (".mhclo",)),
    "eyes":      ("eyes",      (".mhclo",)),
    "eyebrows":  ("eyebrows",  (".mhclo",)),
    "eyelashes": ("eyelashes", (".mhclo",)),
    "teeth":     ("teeth",     (".mhclo",)),
    "tongue":    ("tongue",    (".mhclo",)),
    "proxy":     ("proxy",     (".proxy",)),
    "skin":      ("skins",     (".mhmat",)),
    "pose":      ("poses",     (".bvh", ".mhpose")),
    "rig":       ("rigs",      (".mhskel",)),
    "expression":("expressions", (".mhpose",)),
}


class CacheService:
    """Singleton-style service managing the SQLite asset cache."""

    _db_path: Optional[Path] = None
    _conn: Optional[sqlite3.Connection] = None

    @classmethod
    def init(cls, db_path: Optional[str | Path] = None) -> None:
        """Initialise (or re-open) the cache database."""
        if db_path is None:
            db_dir = user_home_dir() / "dbcache"
            db_dir.mkdir(parents=True, exist_ok=True)
            db_path = db_dir / "assets.db"
        cls._db_path = Path(db_path)
        cls._conn = sqlite3.connect(str(cls._db_path), check_same_thread=False)
        cls._conn.row_factory = sqlite3.Row
        cls._conn.executescript(_DB_SCHEMA)
        cls._conn.commit()
        logger.info("Asset cache opened: %s", cls._db_path)

    @classmethod
    def _ensure_conn(cls) -> sqlite3.Connection:
        if cls._conn is None:
            cls.init()
        assert cls._conn is not None
        return cls._conn

    # ------------------------------------------------------------------
    # Discovery / rebuild
    # ------------------------------------------------------------------

    @classmethod
    def rebuild(cls, base_mesh: str = "hm08") -> int:
        """
        Scan the data directory and user home directory for assets and
        populate/refresh the database.  Returns the total count inserted.
        """
        conn = cls._ensure_conn()
        total = 0

        search_roots = [
            (DATA_DIR, True),
            (user_home_dir(), False),
        ]

        for root, is_system in search_roots:
            for asset_type, (subdir, extensions) in _ASSET_DIRS.items():
                directories = [
                    root / subdir / base_mesh,
                    root / subdir,
                ]
                for directory in directories:
                    if not directory.exists():
                        continue
                    for ext in extensions:
                        for file_path in directory.rglob(f"*{ext}"):
                            try:
                                total += cls._upsert_asset(
                                    conn, file_path, asset_type,
                                    base_mesh, is_system,
                                )
                            except Exception as exc:
                                logger.warning("Failed to cache %s: %s", file_path, exc)

        conn.commit()
        logger.info("Cache rebuild done — %d assets", total)
        return total

    @classmethod
    def _upsert_asset(
        cls,
        conn: sqlite3.Connection,
        file_path: Path,
        asset_type: str,
        base_mesh: str,
        is_system: bool,
    ) -> int:
        """Insert or update a single asset record.  Returns 1 if changed."""
        file_hash = cls._file_hash(file_path)
        existing = conn.execute(
            "SELECT hash FROM assets WHERE file_path = ?", (str(file_path),)
        ).fetchone()
        if existing and existing["hash"] == file_hash:
            return 0

        meta = cls._read_asset_meta(file_path, asset_type)
        thumbnail_path = FileHelpers.thumbnail_path(file_path)
        thumbnail_b64 = FileHelpers.encode_thumbnail(thumbnail_path)

        conn.execute(
            """
            INSERT INTO assets
                (uuid, name, asset_type, file_path, base_mesh, tags,
                 license, author, description, thumbnail, material_file,
                 is_system, hash)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
            ON CONFLICT(file_path) DO UPDATE SET
                uuid=excluded.uuid,
                name=excluded.name,
                tags=excluded.tags,
                license=excluded.license,
                author=excluded.author,
                description=excluded.description,
                thumbnail=excluded.thumbnail,
                material_file=excluded.material_file,
                is_system=excluded.is_system,
                hash=excluded.hash
            """,
            (
                meta.get("uuid"),
                meta.get("name", file_path.stem),
                asset_type,
                str(file_path),
                base_mesh,
                json.dumps(meta.get("tags", [])),
                meta.get("license"),
                meta.get("author"),
                meta.get("description", ""),
                thumbnail_b64,
                meta.get("material"),
                1 if is_system else 0,
                file_hash,
            ),
        )
        return 1

    @staticmethod
    def _file_hash(path: Path) -> str:
        h = hashlib.md5()
        with open(path, "rb") as fh:
            h.update(fh.read(8192))
        return h.hexdigest()

    @staticmethod
    def _read_asset_meta(path: Path, asset_type: str) -> Dict[str, Any]:
        """
        Read lightweight metadata from the asset file header.
        .mhclo / .mhskel / .mhpose start with comment lines:
            # name  My Asset Name
            # uuid  abc-123
            # license CC-BY
            # author  Someone
            # tags  tag1 tag2
        """
        meta: Dict[str, Any] = {"name": path.stem}
        try:
            with path.open("r", encoding="utf-8", errors="replace") as fh:
                for _ in range(30):  # Read first 30 lines only
                    line = fh.readline()
                    if not line:
                        break
                    line = line.strip()
                    if not line.startswith("#"):
                        if not line.startswith("//") and asset_type != "skin":
                            break
                        continue
                    parts = line[1:].strip().split(None, 1)
                    if len(parts) == 2:
                        k, v = parts[0].lower(), parts[1].strip()
                        if k in ("name", "uuid", "license", "author", "description", "material"):
                            meta[k] = v
                        elif k == "tags":
                            meta["tags"] = v.split()
        except Exception:
            pass
        return meta

    # ------------------------------------------------------------------
    # Query
    # ------------------------------------------------------------------

    @classmethod
    def query(
        cls,
        asset_type: Optional[str] = None,
        base_mesh: Optional[str] = None,
        tags: Optional[List[str]] = None,
        search: Optional[str] = None,
        installed_only: bool = True,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[List[Dict[str, Any]], int]:
        """Return (items, total_count) for the given filters."""
        conn = cls._ensure_conn()
        where: List[str] = []
        params: List[Any] = []

        if asset_type:
            where.append("asset_type = ?")
            params.append(asset_type)
        if base_mesh:
            where.append("base_mesh = ?")
            params.append(base_mesh)
        if search:
            where.append("name LIKE ?")
            params.append(f"%{search}%")
        if installed_only:
            where.append("is_system = 1")

        where_clause = ("WHERE " + " AND ".join(where)) if where else ""
        count_row = conn.execute(
            f"SELECT COUNT(*) FROM assets {where_clause}", params
        ).fetchone()
        total = count_row[0] if count_row else 0

        offset = (page - 1) * page_size
        rows = conn.execute(
            f"SELECT * FROM assets {where_clause} ORDER BY name LIMIT ? OFFSET ?",
            params + [page_size, offset],
        ).fetchall()

        items = []
        for row in rows:
            item = dict(row)
            item["tags"] = json.loads(item.get("tags") or "[]")
            # Filter by tags after deserialisation
            if tags:
                row_tags = set(item["tags"])
                if not all(t in row_tags for t in tags):
                    continue
            items.append(item)

        return items, total

    @classmethod
    def get_by_name(cls, name: str, asset_type: Optional[str] = None) -> Optional[Dict[str, Any]]:
        conn = cls._ensure_conn()
        q = "SELECT * FROM assets WHERE name = ?"
        params: List[Any] = [name]
        if asset_type:
            q += " AND asset_type = ?"
            params.append(asset_type)
        row = conn.execute(q, params).fetchone()
        if row:
            item = dict(row)
            item["tags"] = json.loads(item.get("tags") or "[]")
            return item
        return None

    @classmethod
    def get_by_uuid(cls, uuid: str) -> Optional[Dict[str, Any]]:
        conn = cls._ensure_conn()
        row = conn.execute("SELECT * FROM assets WHERE uuid = ?", (uuid,)).fetchone()
        if row:
            item = dict(row)
            item["tags"] = json.loads(item.get("tags") or "[]")
            return item
        return None

    @classmethod
    def close(cls) -> None:
        if cls._conn:
            cls._conn.close()
            cls._conn = None
