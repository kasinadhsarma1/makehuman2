"""
Asset service for MakeHuman2 backend.

Handles asset discovery, filtering, equipping/unequipping.
Mirrors core/globenv.py asset repository and gui/qtreeselect.py logic.
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from ..models.asset import (
    AssetApplyRequest,
    AssetFilter,
    AssetListResponse,
    AssetModel,
    AssetRemoveRequest,
    AssetType,
    EquipmentSlot,
)
from ..utils.file_helpers import FileHelpers, get_base_mesh_dir, user_home_dir
from .cache_service import CacheService

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# In-memory equipment state (single character session)
# ---------------------------------------------------------------------------
_equipped: Dict[str, Any] = {
    "skinMaterial": None,
    "clothes": [],
    "hair": [],
    "eyes": None,
    "eyebrows": None,
    "eyelashes": None,
    "teeth": None,
    "tongue": None,
    "proxy": None,
}


class AssetService:
    """Static service for asset management."""

    # ------------------------------------------------------------------
    # Listing
    # ------------------------------------------------------------------

    @classmethod
    def list_assets(cls, filters: AssetFilter) -> AssetListResponse:
        items_raw, total = CacheService.query(
            asset_type=filters.asset_type.value if filters.asset_type else None,
            base_mesh=filters.base_mesh,
            tags=filters.tags if filters.tags else None,
            search=filters.search,
            installed_only=filters.installed_only,
            page=filters.page,
            page_size=filters.page_size,
        )
        items = [cls._row_to_model(r) for r in items_raw]
        return AssetListResponse(
            total=total,
            page=filters.page,
            page_size=filters.page_size,
            items=items,
        )

    @classmethod
    def get_asset(
        cls,
        name: Optional[str] = None,
        uuid: Optional[str] = None,
        asset_type: Optional[AssetType] = None,
    ) -> Optional[AssetModel]:
        if uuid:
            row = CacheService.get_by_uuid(uuid)
        elif name:
            row = CacheService.get_by_name(
                name,
                asset_type.value if asset_type else None,
            )
        else:
            return None
        return cls._row_to_model(row) if row else None

    # ------------------------------------------------------------------
    # Equipment management
    # ------------------------------------------------------------------

    @classmethod
    def get_equipment(cls) -> Dict[str, Any]:
        return dict(_equipped)

    @classmethod
    def apply_asset(cls, request: AssetApplyRequest, asset_type: AssetType) -> AssetModel:
        """
        Equip an asset on the character.  For multi-slot types (clothes, hair)
        it appends; for single-slot types it replaces.
        Raises ValueError if the asset cannot be found.
        """
        asset = cls._resolve_asset(request, asset_type)
        if asset is None:
            raise ValueError(
                f"Asset not found: name={request.asset_name} "
                f"uuid={request.asset_uuid} path={request.file_path}"
            )

        slot = asset_type.value
        entry = {
            "name": asset.name,
            "uuid": asset.uuid,
            "file_path": asset.file_path,
            "material": request.material_override or asset.material_file,
        }

        if slot in ("clothes", "hair"):
            existing = _equipped[slot]
            # Avoid duplicates by name
            if not any(e["name"] == asset.name for e in existing):
                _equipped[slot].append(entry)
        else:
            _equipped[slot] = entry

        logger.info("Equipped %s: %s", slot, asset.name)
        return asset

    @classmethod
    def remove_asset(cls, request: AssetRemoveRequest) -> bool:
        """Remove an equipped asset.  Returns True if it was found."""
        slot = request.asset_type.value
        if slot in ("clothes", "hair"):
            before = len(_equipped[slot])
            _equipped[slot] = [
                e for e in _equipped[slot] if e["name"] != request.asset_name
            ]
            return len(_equipped[slot]) < before
        else:
            if _equipped.get(slot) and _equipped[slot]["name"] == request.asset_name:
                _equipped[slot] = None
                return True
        return False

    @classmethod
    def clear_equipment(cls, slot: Optional[str] = None) -> None:
        """Clear all or a specific equipment slot."""
        if slot:
            if slot in ("clothes", "hair"):
                _equipped[slot] = []
            else:
                _equipped[slot] = None
        else:
            _equipped.update({
                "skinMaterial": None,
                "clothes": [],
                "hair": [],
                "eyes": None,
                "eyebrows": None,
                "eyelashes": None,
                "teeth": None,
                "tongue": None,
                "proxy": None,
            })

    @classmethod
    def apply_skin(cls, material_path: str) -> bool:
        """Set the skin material.  Returns False if the file does not exist."""
        p = Path(material_path)
        if not p.exists():
            # Try resolving relative to data dir
            resolved = FileHelpers.resolve_asset_path(
                material_path, asset_type="skins"
            )
            if resolved is None:
                return False
            material_path = str(resolved)
        _equipped["skinMaterial"] = material_path
        return True

    # ------------------------------------------------------------------
    # Available base meshes
    # ------------------------------------------------------------------

    @classmethod
    def list_base_meshes(cls) -> List[str]:
        from ..utils.file_helpers import DATA_DIR
        base_dir = DATA_DIR / "base"
        if not base_dir.exists():
            return []
        return sorted(d.name for d in base_dir.iterdir() if d.is_dir())

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @classmethod
    def _resolve_asset(
        cls,
        request: AssetApplyRequest,
        asset_type: AssetType,
    ) -> Optional[AssetModel]:
        if request.file_path:
            p = Path(request.file_path)
            if p.exists():
                return AssetModel(
                    name=p.stem,
                    asset_type=asset_type,
                    file_path=str(p),
                    base_mesh="hm08",
                )
        return cls.get_asset(
            name=request.asset_name,
            uuid=request.asset_uuid,
            asset_type=asset_type,
        )

    @staticmethod
    def _row_to_model(row: Dict[str, Any]) -> AssetModel:
        return AssetModel(
            uuid=row.get("uuid"),
            name=row["name"],
            asset_type=AssetType(row["asset_type"]),
            file_path=row["file_path"],
            base_mesh=row.get("base_mesh", "hm08"),
            tags=row.get("tags", []),
            license=row.get("license"),
            author=row.get("author"),
            description=row.get("description", ""),
            thumbnail=row.get("thumbnail"),
            material_file=row.get("material_file"),
            is_installed=True,
            is_system=bool(row.get("is_system", 1)),
        )
