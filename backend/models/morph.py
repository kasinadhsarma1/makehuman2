"""
Morph / target data models for MakeHuman2 API.

Mirrors core/target.py (Modelling, Morphtarget, Targets).
"""
from __future__ import annotations

from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class MorphTarget(BaseModel):
    """Raw morph target — vertex displacements."""
    name: str
    file_path: Optional[str] = Field(default=None, alias="filePath")
    vertex_count: int = Field(default=0, alias="vertexCount")
    # Sparse dict: vertex_index → [dx, dy, dz]
    displacements: Optional[Dict[str, List[float]]] = Field(
        default=None,
        description="Sparse vertex displacement map (only present when full=true)",
    )

    class Config:
        populate_by_name = True


class MorphModifier(BaseModel):
    """
    Slider-level modifier — wraps one or two MorphTargets (incr/decr).
    Corresponds to core/target.py Modelling class.
    """
    name: str = Field(description="Display name, e.g. 'Body Height'")
    target_path: str = Field(alias="targetPath", description="Internal path key, e.g. 'body/height'")
    group: str = Field(default="", description="UI group/category")
    macro: Optional[str] = Field(default=None, description="Parent macro name e.g. 'Gender'")

    value: float = Field(
        default=0.5, ge=0.0, le=1.0,
        description="Current value 0–1 (0.5 = neutral)",
    )
    default: float = Field(
        default=0.5, ge=0.0, le=1.0,
        description="Default/neutral value",
    )

    incr_target: Optional[str] = Field(
        default=None, alias="incrTarget",
        description="Name of the increase-direction morph target",
    )
    decr_target: Optional[str] = Field(
        default=None, alias="decrTarget",
        description="Name of the decrease-direction morph target",
    )

    is_symmetric: bool = Field(default=False, alias="isSymmetric")
    symmetric_name: Optional[str] = Field(default=None, alias="symmetricName")
    measure: Optional[str] = Field(
        default=None, description="Linked measurement name",
    )

    class Config:
        populate_by_name = True


class MorphCategory(BaseModel):
    """Grouped collection of modifiers shown in one UI panel."""
    name: str
    label: str
    modifiers: List[MorphModifier] = Field(default_factory=list)
    subcategories: List["MorphCategory"] = Field(default_factory=list)

    class Config:
        populate_by_name = True


MorphCategory.model_rebuild()


class MorphValue(BaseModel):
    """Single modifier value update."""
    target_path: str = Field(alias="targetPath")
    value: float = Field(ge=0.0, le=1.0)

    class Config:
        populate_by_name = True


class MorphBatchUpdate(BaseModel):
    """Batch update for multiple morph values at once."""
    values: List[MorphValue]
    recalculate_normals: bool = Field(
        default=True, alias="recalculateNormals",
        description="Recalculate vertex normals after applying",
    )

    class Config:
        populate_by_name = True


class MorphResetRequest(BaseModel):
    """Request to reset morphs to defaults."""
    category: Optional[str] = Field(
        default=None,
        description="If set, only reset morphs in this category",
    )
    reset_macros: bool = Field(
        default=True, alias="resetMacros",
        description="Also reset macro-level sliders",
    )

    class Config:
        populate_by_name = True


class MorphSearchResult(BaseModel):
    """Search result entry for morph discovery."""
    target_path: str = Field(alias="targetPath")
    name: str
    group: str
    current_value: float = Field(alias="currentValue")
    is_modified: bool = Field(alias="isModified", description="True if differs from default")

    class Config:
        populate_by_name = True
