"""
Material service for MakeHuman2 backend.

Handles .mhmat file parsing, material state, and per-mesh material assignment.
Mirrors opengl/material.py.
"""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

from ..models.material import MaterialListItem, MaterialModel, MaterialUpdate, RGBColor, ShaderType, TextureSlot
from ..utils.file_helpers import DATA_DIR, FileHelpers

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# In-memory material registry (name → MaterialModel)
# ---------------------------------------------------------------------------
_materials: Dict[str, MaterialModel] = {}


class MaterialService:
    """Static service for material management."""

    # ------------------------------------------------------------------
    # Discovery
    # ------------------------------------------------------------------

    @classmethod
    def list_materials(
        cls,
        search: Optional[str] = None,
    ) -> List[MaterialListItem]:
        cls._ensure_loaded()
        items = []
        for name, mat in _materials.items():
            if search and search.lower() not in name.lower():
                continue
            items.append(MaterialListItem(
                name=name,
                file_path=mat.name,  # re-used as path stub
                shader=mat.shader,
                has_diffuse_texture=mat.diffuse_texture is not None,
            ))
        return items

    @classmethod
    def get_material(cls, name: str) -> Optional[MaterialModel]:
        cls._ensure_loaded()
        return _materials.get(name)

    @classmethod
    def load_from_file(cls, path: str | Path) -> MaterialModel:
        """Parse a .mhmat file and register it."""
        p = Path(path)
        raw = FileHelpers.mhmat_to_dict(p)
        mat = cls._dict_to_model(p.stem, raw)
        _materials[p.stem] = mat
        return mat

    # ------------------------------------------------------------------
    # Updates
    # ------------------------------------------------------------------

    @classmethod
    def update_material(cls, name: str, update: MaterialUpdate) -> Optional[MaterialModel]:
        mat = _materials.get(name)
        if mat is None:
            return None
        patch = update.model_dump(exclude_none=True, by_alias=False)
        updated = mat.model_copy(update=patch)
        _materials[name] = updated
        return updated

    @classmethod
    def register_material(cls, mat: MaterialModel) -> None:
        _materials[mat.name] = mat

    # ------------------------------------------------------------------
    # Parsing helpers
    # ------------------------------------------------------------------

    @classmethod
    def _ensure_loaded(cls) -> None:
        if _materials:
            return
        skin_dir = DATA_DIR / "skins"
        if skin_dir.exists():
            for mhmat in skin_dir.rglob("*.mhmat"):
                try:
                    cls.load_from_file(mhmat)
                except Exception as exc:
                    logger.debug("Skip %s: %s", mhmat, exc)

    @staticmethod
    def _dict_to_model(name: str, raw: Dict[str, Any]) -> MaterialModel:
        """Convert a parsed .mhmat dict to a MaterialModel."""

        def _color(key: str, default: List[float]) -> RGBColor:
            v = raw.get(key, default)
            if isinstance(v, list) and len(v) >= 3:
                return RGBColor(r=v[0], g=v[1], b=v[2])
            return RGBColor(r=default[0], g=default[1], b=default[2])

        def _texture(key: str) -> Optional[TextureSlot]:
            v = raw.get(key)
            if v and isinstance(v, str):
                return TextureSlot(path=v)
            return None

        shader_str = str(raw.get("shader", "phong")).lower()
        try:
            shader = ShaderType(shader_str)
        except ValueError:
            shader = ShaderType.PHONG

        return MaterialModel(
            name=name,
            shader=shader,
            diffuse_texture=_texture("diffuseTexture"),
            normal_map=_texture("normalMap"),
            ao_map=_texture("aoMap"),
            mr_map=_texture("mrMap"),
            emission_map=_texture("emissionMap"),
            diffuse_color=_color("diffuseColor", [0.8, 0.8, 0.8]),
            specular_color=_color("specularColor", [1.0, 1.0, 1.0]),
            emissive_color=_color("emissiveColor", [0.0, 0.0, 0.0]),
            metallic_factor=float(raw.get("metallicFactor", 0.0)),
            roughness_factor=float(raw.get("roughnessFactor", 0.5)),
            specular_focus=float(raw.get("specularFocus", 30.0)),
            transparent=bool(raw.get("transparent", False)),
            alpha=float(raw.get("alpha", 1.0)),
            alpha_to_coverage=bool(raw.get("alphaToCoverage", False)),
            backface_cull=bool(raw.get("backfaceCull", True)),
            normalmap_intensity=float(raw.get("normalmapIntensity", 1.0)),
            aomap_intensity=float(raw.get("aomapIntensity", 1.0)),
        )
