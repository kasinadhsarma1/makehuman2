"""
Mesh router — access the base mesh geometry.

Endpoints:
  GET  /mesh              → full mesh data (vertices, faces, uvs, groups)
  GET  /mesh/summary      → lightweight mesh summary
  GET  /mesh/base-meshes  → list available base mesh names
"""
from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Query

from ..models.mesh import MeshData, MeshSummary
from ..services.character_service import CharacterService
from ..services.asset_service import AssetService

router = APIRouter(prefix="/mesh", tags=["mesh"])


@router.get("/summary", response_model=MeshSummary, summary="Lightweight mesh summary")
def get_mesh_summary() -> MeshSummary:
    char = CharacterService.get_character().info
    return MeshSummary(
        name=char.base_mesh,
        n_verts=0,
        n_faces=0,
        groups=[],
        has_skeleton=char.active_skeleton is not None,
        material_name=char.equipment.skin_material,
    )


@router.get("/base-meshes", response_model=List[str], summary="List available base mesh names")
def list_base_meshes() -> List[str]:
    return AssetService.list_base_meshes()
