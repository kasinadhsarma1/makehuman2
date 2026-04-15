"""
Assets router — asset discovery and equipment management.

Endpoints:
  GET    /assets                        → list all assets (paginated)
  GET    /assets/equipment              → current equipment state
  GET    /assets/base-meshes            → available base mesh names
  POST   /assets/rebuild-cache          → rebuild SQLite asset cache
  GET    /assets/{asset_type}           → list assets by type
  POST   /assets/{asset_type}/apply     → equip an asset
  DELETE /assets/{asset_type}/{name}    → unequip an asset
  POST   /assets/skin                   → set skin material
  DELETE /assets/equipment              → clear all equipment
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Body, HTTPException, Query, status

from ..models.asset import (
    AssetApplyRequest,
    AssetFilter,
    AssetListResponse,
    AssetModel,
    AssetRemoveRequest,
    AssetType,
)
from ..services.asset_service import AssetService
from ..services.cache_service import CacheService

router = APIRouter(prefix="/assets", tags=["assets"])


@router.get("", response_model=AssetListResponse, summary="List assets with optional filters")
def list_assets(
    asset_type: Optional[AssetType] = Query(default=None, alias="assetType"),
    base_mesh: Optional[str] = Query(default=None, alias="baseMesh"),
    search: Optional[str] = Query(default=None),
    tags: Optional[str] = Query(default=None, description="Comma-separated tag list"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, alias="pageSize", ge=1, le=200),
) -> AssetListResponse:
    tag_list = [t.strip() for t in tags.split(",")] if tags else []
    filters = AssetFilter(
        asset_type=asset_type,
        base_mesh=base_mesh,
        tags=tag_list,
        search=search,
        page=page,
        page_size=page_size,
    )
    return AssetService.list_assets(filters)


@router.get(
    "/equipment",
    response_model=Dict[str, Any],
    summary="Get current equipment state",
)
def get_equipment() -> Dict[str, Any]:
    return AssetService.get_equipment()


@router.get(
    "/base-meshes",
    response_model=List[str],
    summary="List available base mesh names",
)
def list_base_meshes() -> List[str]:
    return AssetService.list_base_meshes()


@router.post(
    "/rebuild-cache",
    response_model=dict,
    summary="Rebuild the SQLite asset cache by scanning data directories",
)
def rebuild_cache(
    base_mesh: str = Query(default="hm08", alias="baseMesh"),
) -> dict:
    count = CacheService.rebuild(base_mesh=base_mesh)
    return {"rebuilt": True, "count": count}


@router.get(
    "/{asset_type}",
    response_model=AssetListResponse,
    summary="List assets of a specific type",
)
def list_by_type(
    asset_type: AssetType,
    base_mesh: Optional[str] = Query(default=None, alias="baseMesh"),
    search: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, alias="pageSize"),
) -> AssetListResponse:
    filters = AssetFilter(
        asset_type=asset_type,
        base_mesh=base_mesh,
        search=search,
        page=page,
        page_size=page_size,
    )
    return AssetService.list_assets(filters)


@router.post(
    "/{asset_type}/apply",
    response_model=AssetModel,
    status_code=status.HTTP_200_OK,
    summary="Equip an asset on the character",
)
def apply_asset(asset_type: AssetType, request: AssetApplyRequest) -> AssetModel:
    try:
        return AssetService.apply_asset(request, asset_type)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.delete(
    "/{asset_type}/{asset_name}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove an equipped asset",
)
def remove_asset(asset_type: AssetType, asset_name: str) -> None:
    request = AssetRemoveRequest(asset_name=asset_name, asset_type=asset_type)
    found = AssetService.remove_asset(request)
    if not found:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset '{asset_name}' of type '{asset_type}' is not equipped",
        )


@router.post("/skin", response_model=dict, summary="Set the skin material")
def set_skin(material_path: str = Body(..., embed=True, alias="materialPath")) -> dict:
    ok = AssetService.apply_skin(material_path)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Material file not found: {material_path}",
        )
    return {"applied": True, "materialPath": material_path}


@router.delete(
    "/equipment",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Clear all equipped assets",
)
def clear_equipment() -> None:
    AssetService.clear_equipment()
