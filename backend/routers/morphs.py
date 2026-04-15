"""
Morphs router — manage morph target sliders.

Endpoints:
  GET    /morphs                    → all modifiers (optionally filtered)
  GET    /morphs/categories         → category tree
  GET    /morphs/modified           → only non-default values
  GET    /morphs/{target_path}      → single modifier
  PUT    /morphs/{target_path}      → update single modifier value
  POST   /morphs/batch              → update multiple modifier values
  POST   /morphs/reset              → reset modifiers to defaults
"""
from __future__ import annotations

from typing import Dict, List, Optional

from fastapi import APIRouter, Body, HTTPException, Query, status

from ..models.morph import (
    MorphBatchUpdate,
    MorphCategory,
    MorphModifier,
    MorphResetRequest,
    MorphValue,
)
from ..services.morph_service import MorphService

router = APIRouter(prefix="/morphs", tags=["morphs"])


@router.get("", response_model=List[MorphModifier], summary="List all morph modifiers")
def list_morphs(
    category: Optional[str] = Query(default=None, description="Filter by category prefix"),
    search: Optional[str] = Query(default=None, description="Substring search on name"),
    modified_only: bool = Query(default=False, alias="modifiedOnly"),
) -> List[MorphModifier]:
    return MorphService.get_modifiers(
        category=category,
        search=search,
        modified_only=modified_only,
    )


@router.get(
    "/categories",
    response_model=List[MorphCategory],
    summary="Get the morph category tree",
)
def get_categories() -> List[MorphCategory]:
    return MorphService.get_categories()


@router.get(
    "/modified",
    response_model=Dict[str, float],
    summary="Get all non-default modifier values",
)
def get_modified() -> Dict[str, float]:
    return MorphService.get_modified_values()


@router.get(
    "/values",
    response_model=Dict[str, float],
    summary="Get all modifier values",
)
def get_all_values() -> Dict[str, float]:
    return MorphService.get_all_values()


@router.get(
    "/{target_path:path}",
    response_model=MorphModifier,
    summary="Get a single morph modifier",
)
def get_morph(target_path: str) -> MorphModifier:
    mod = MorphService.get_modifier(target_path)
    if mod is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Modifier not found: {target_path}",
        )
    return mod


@router.put(
    "/{target_path:path}",
    response_model=MorphModifier,
    summary="Set a single morph modifier value",
)
def set_morph(
    target_path: str,
    value: float = Body(..., ge=0.0, le=1.0, embed=True),
) -> MorphModifier:
    ok = MorphService.set_value(target_path, value)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Modifier not found: {target_path}",
        )
    mod = MorphService.get_modifier(target_path)
    assert mod is not None
    return mod


@router.post(
    "/batch",
    response_model=Dict[str, bool],
    summary="Set multiple morph modifier values at once",
)
def batch_update(update: MorphBatchUpdate) -> Dict[str, bool]:
    return MorphService.set_batch(update.values)


@router.post(
    "/reset",
    response_model=dict,
    summary="Reset morph modifiers to their defaults",
)
def reset_morphs(request: MorphResetRequest = MorphResetRequest()) -> dict:
    count = MorphService.reset(category=request.category)
    return {"reset": count}
