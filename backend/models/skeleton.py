"""
Skeleton and pose data models for MakeHuman2 API.

Mirrors obj3d/skeleton.py (cBone, skeleton) and obj3d/animation.py (BVH, MHPose).
"""
from __future__ import annotations

from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class BoneModel(BaseModel):
    """Single bone in the skeleton hierarchy."""
    name: str
    parent: Optional[str] = None
    children: List[str] = Field(default_factory=list)
    level: int = 0

    head_joint: str = Field(alias="headJoint")
    tail_joint: str = Field(alias="tailJoint")

    # 4x4 matrices stored as flat 16-element lists (row-major)
    mat_rest_global: Optional[List[float]] = Field(
        default=None, alias="matRestGlobal",
        description="Global rest-pose matrix (4x4 row-major)",
    )
    mat_rest_local: Optional[List[float]] = Field(
        default=None, alias="matRestLocal",
        description="Local rest-pose matrix relative to parent",
    )
    mat_pose_local: Optional[List[float]] = Field(
        default=None, alias="matPoseLocal",
        description="Local pose matrix (current animation frame)",
    )
    mat_pose_global: Optional[List[float]] = Field(
        default=None, alias="matPoseGlobal",
        description="Global pose matrix (current animation frame)",
    )

    head_pos: Optional[List[float]] = Field(
        default=None, alias="headPos",
        description="[x, y, z] world position of head joint",
    )
    tail_pos: Optional[List[float]] = Field(
        default=None, alias="tailPos",
        description="[x, y, z] world position of tail joint",
    )

    class Config:
        populate_by_name = True


class JointPosition(BaseModel):
    """Named joint with its world-space position."""
    name: str
    position: List[float] = Field(description="[x, y, z]")


class SkeletonModel(BaseModel):
    """Full skeleton/rig description."""
    name: str
    root_bone: str = Field(alias="rootBone")
    bones: Dict[str, BoneModel]
    joints: Dict[str, JointPosition] = Field(default_factory=dict)
    weights_file: Optional[str] = Field(default=None, alias="weightsFile")

    class Config:
        populate_by_name = True


class PoseFrame(BaseModel):
    """Single frame of pose/animation data."""
    frame_index: int = Field(default=0, alias="frameIndex")
    bone_rotations: Dict[str, List[float]] = Field(
        alias="boneRotations",
        description="Bone name → [rx, ry, rz] Euler angles in degrees",
    )
    root_translation: Optional[List[float]] = Field(
        default=None, alias="rootTranslation",
        description="[x, y, z] root bone translation (for locomotion)",
    )

    class Config:
        populate_by_name = True


class PoseModel(BaseModel):
    """Complete pose (single frame or BVH animation)."""
    name: str
    source_file: Optional[str] = Field(default=None, alias="sourceFile")
    frame_count: int = Field(default=1, alias="frameCount")
    frame_time: float = Field(
        default=0.041667, alias="frameTime",
        description="Seconds per frame (default 1/24)",
    )
    frames: List[PoseFrame] = Field(default_factory=list)

    class Config:
        populate_by_name = True


class PoseApplyRequest(BaseModel):
    """Request body for POST /skeleton/pose."""
    pose_name: Optional[str] = Field(default=None, alias="poseName")
    pose_file: Optional[str] = Field(default=None, alias="poseFile")
    frame_index: int = Field(default=0, alias="frameIndex")

    class Config:
        populate_by_name = True


class BoneOverrideRequest(BaseModel):
    """Request body for manual bone rotation override."""
    bone_name: str = Field(alias="boneName")
    rotation: List[float] = Field(description="[rx, ry, rz] Euler angles in degrees")
    translation: Optional[List[float]] = Field(
        default=None, description="[x, y, z] optional translation",
    )

    class Config:
        populate_by_name = True


class SkeletonListItem(BaseModel):
    """Lightweight skeleton entry for list endpoints."""
    name: str
    file_path: str = Field(alias="filePath")
    bone_count: int = Field(alias="boneCount")
    description: str = ""

    class Config:
        populate_by_name = True
