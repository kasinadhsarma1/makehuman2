"""
Materials router — material discovery and editing.

Endpoints:
  GET    /materials                → list all loaded materials
  GET    /materials/{name}         → get a single material
  POST   /materials/load           → load material from .mhmat file
  PATCH  /materials/{name}         → partial update of a material
"""
from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Body, HTTPException, Query, status

from ..models.material import MaterialListItem, MaterialModel, MaterialUpdate
from ..services.material_service import MaterialService

router = APIRouter(prefix="/materials", tags=["materials"])


@router.get(
    "",
    response_model=List[MaterialListItem],
    summary="List all loaded materials",
)
def list_materials(
    search: Optional[str] = Query(default=None),
) -> List[MaterialListItem]:
    return MaterialService.list_materials(search=search)


@router.get(
    "/{name}",
    response_model=MaterialModel,
    summary="Get a single material by name",
)
def get_material(name: str) -> MaterialModel:
    mat = MaterialService.get_material(name)
    if mat is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Material not found: {name}",
        )
    return mat


@router.post(
    "/load",
    response_model=MaterialModel,
    summary="Load and register a material from a .mhmat file",
)
def load_material(
    file_path: str = Body(..., embed=True, alias="filePath"),
) -> MaterialModel:
    try:
        return MaterialService.load_from_file(file_path)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.patch(
    "/{name}",
    response_model=MaterialModel,
    summary="Partially update a material",
)
def update_material(name: str, update: MaterialUpdate) -> MaterialModel:
    mat = MaterialService.update_material(name, update)
    if mat is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Material not found: {name}",
        )
    return mat
