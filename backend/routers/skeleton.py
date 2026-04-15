"""
Skeleton router — rig loading and pose management.

Endpoints:
  GET    /skeleton                   → current skeleton
  GET    /skeleton/list              → available skeleton files
  POST   /skeleton/load              → load a skeleton
  GET    /skeleton/poses             → list available poses
  GET    /skeleton/pose              → current pose
  POST   /skeleton/pose              → apply a pose
  PUT    /skeleton/pose/bone         → override a single bone
  DELETE /skeleton/pose              → reset to rest pose
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Body, HTTPException, Query, status

from ..models.skeleton import (
    BoneOverrideRequest,
    PoseApplyRequest,
    PoseModel,
    SkeletonListItem,
    SkeletonModel,
)
from ..services.skeleton_service import SkeletonService

router = APIRouter(prefix="/skeleton", tags=["skeleton"])


@router.get(
    "",
    response_model=Optional[SkeletonModel],
    summary="Get the current skeleton",
)
def get_skeleton() -> Optional[SkeletonModel]:
    return SkeletonService.get_current_skeleton()


@router.get(
    "/list",
    response_model=List[SkeletonListItem],
    summary="List available skeleton/rig files",
)
def list_skeletons(
    base_mesh: str = Query(default="hm08", alias="baseMesh"),
) -> List[SkeletonListItem]:
    return SkeletonService.list_skeletons(base_mesh=base_mesh)


@router.post(
    "/load",
    response_model=SkeletonModel,
    summary="Load a skeleton from a .mhskel file",
)
def load_skeleton(
    skel_path: str = Body(..., embed=True, alias="skelPath"),
    base_mesh: str = Body(default="hm08", embed=True, alias="baseMesh"),
) -> SkeletonModel:
    try:
        return SkeletonService.load_skeleton(skel_path, base_mesh=base_mesh)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.get(
    "/poses",
    response_model=List[Dict[str, str]],
    summary="List available pose files",
)
def list_poses(
    base_mesh: str = Query(default="hm08", alias="baseMesh"),
) -> List[Dict[str, str]]:
    return SkeletonService.list_poses(base_mesh=base_mesh)


@router.get(
    "/pose",
    response_model=Optional[PoseModel],
    summary="Get the current pose",
)
def get_pose() -> Optional[PoseModel]:
    return SkeletonService.get_current_pose()


@router.post(
    "/pose",
    response_model=Optional[PoseModel],
    summary="Apply a pose from file or by name",
)
def apply_pose(request: PoseApplyRequest) -> Optional[PoseModel]:
    try:
        return SkeletonService.apply_pose(request)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.put(
    "/pose/bone",
    response_model=dict,
    summary="Manually override a single bone rotation",
)
def override_bone(request: BoneOverrideRequest) -> dict:
    ok = SkeletonService.override_bone(request)
    return {"overridden": ok, "boneName": request.bone_name}


@router.delete(
    "/pose",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Reset character to rest pose",
)
def reset_pose() -> None:
    SkeletonService.reset_pose()
