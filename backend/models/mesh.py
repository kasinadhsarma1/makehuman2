"""
Mesh data models for MakeHuman2 API.

Mirrors obj3d/object3d.py data structures.
"""
from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field


class VertexData(BaseModel):
    """Flat vertex array representation."""
    positions: List[List[float]] = Field(
        description="List of [x, y, z] vertex positions",
    )
    normals: Optional[List[List[float]]] = Field(
        default=None, description="Per-vertex normals [x, y, z]",
    )
    uvs: Optional[List[List[float]]] = Field(
        default=None, description="Per-vertex UV coordinates [u, v]",
    )


class MeshGroup(BaseModel):
    """Named face group within the mesh."""
    name: str
    face_indices: List[int] = Field(alias="faceIndices")
    visible: bool = True
    material_name: Optional[str] = Field(default=None, alias="materialName")

    class Config:
        populate_by_name = True


class FaceData(BaseModel):
    """Triangle face indices."""
    indices: List[List[int]] = Field(
        description="List of [v0, v1, v2] triangle index tuples",
    )


class BoneWeight(BaseModel):
    """Skin weight for a single bone–vertex pair."""
    bone_name: str = Field(alias="boneName")
    vertex_index: int = Field(alias="vertexIndex")
    weight: float = Field(ge=0.0, le=1.0)

    class Config:
        populate_by_name = True


class SkinWeights(BaseModel):
    """Full skinning weight table for the mesh."""
    weights_per_vertex: int = Field(alias="weightsPerVertex", description="Max joints per vertex")
    joint_indices: List[List[int]] = Field(
        alias="jointIndices",
        description="Per-vertex joint index arrays (padded to weightsPerVertex)",
    )
    weight_values: List[List[float]] = Field(
        alias="weightValues",
        description="Per-vertex weight arrays (padded to weightsPerVertex)",
    )
    bone_names: List[str] = Field(alias="boneNames")

    class Config:
        populate_by_name = True


class MeshData(BaseModel):
    """Complete mesh data returned by GET /mesh."""
    name: str
    n_verts: int = Field(alias="nVerts")
    n_faces: int = Field(alias="nFaces")
    n_uvs: int = Field(alias="nUVs")
    n_groups: int = Field(alias="nGroups")

    vertices: VertexData
    faces: FaceData
    groups: List[MeshGroup] = Field(default_factory=list)

    skin_weights: Optional[SkinWeights] = Field(default=None, alias="skinWeights")
    overflow_map: Optional[List[List[int]]] = Field(
        default=None, alias="overflowMap",
        description="Duplicate vertex map [[source_idx, dest_idx], ...]",
    )

    class Config:
        populate_by_name = True


class MeshSummary(BaseModel):
    """Lightweight summary without raw geometry."""
    name: str
    n_verts: int = Field(alias="nVerts")
    n_faces: int = Field(alias="nFaces")
    groups: List[str] = Field(description="Visible group names")
    has_skeleton: bool = Field(alias="hasSkeleton")
    material_name: Optional[str] = Field(default=None, alias="materialName")

    class Config:
        populate_by_name = True


class MeshUpdateRequest(BaseModel):
    """Request to update mesh visibility or group state."""
    visible_groups: Optional[List[str]] = Field(default=None, alias="visibleGroups")

    class Config:
        populate_by_name = True
