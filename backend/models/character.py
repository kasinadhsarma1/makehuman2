"""
Character data models for MakeHuman2 API.

Mirrors the structure of core/baseobj.py (MakeHumanModel / baseClass)
and the MHM file format.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class MacroValues(BaseModel):
    """Macro slider values (Gender, Age, Race, etc.)."""
    gender: float = Field(default=0.5, ge=0.0, le=1.0, description="0=female, 1=male")
    age: float = Field(default=0.5, ge=0.0, le=1.0, description="0=child, 1=old")
    muscle: float = Field(default=0.5, ge=0.0, le=1.0)
    weight: float = Field(default=0.5, ge=0.0, le=1.0)
    height: float = Field(default=0.5, ge=0.0, le=1.0)
    breast_size: float = Field(default=0.5, ge=0.0, le=1.0, alias="breastSize")
    breast_firmness: float = Field(default=0.5, ge=0.0, le=1.0, alias="breastFirmness")
    body_proportions: float = Field(default=0.5, ge=0.0, le=1.0, alias="bodyProportions")

    class Config:
        populate_by_name = True


class EquipmentState(BaseModel):
    """Currently equipped assets on the character."""
    skin_material: Optional[str] = Field(default=None, alias="skinMaterial")
    clothes: List[str] = Field(default_factory=list)
    hair: List[str] = Field(default_factory=list)
    eyes: Optional[str] = None
    eyebrows: Optional[str] = None
    eyelashes: Optional[str] = None
    teeth: Optional[str] = None
    tongue: Optional[str] = None
    proxy: Optional[str] = None

    class Config:
        populate_by_name = True


class MeasurementData(BaseModel):
    """Physical measurements derived from morph values."""
    height_cm: Optional[float] = Field(default=None, alias="heightCm")
    chest_cm: Optional[float] = Field(default=None, alias="chestCm")
    waist_cm: Optional[float] = Field(default=None, alias="waistCm")
    hips_cm: Optional[float] = Field(default=None, alias="hipsCm")
    units: str = "metric"

    class Config:
        populate_by_name = True


class CharacterInfo(BaseModel):
    """Full character state — mirrors what getchar/bin_getchar returns."""
    name: str = Field(default="untitled", description="Character name")
    base_mesh: str = Field(default="hm08", alias="baseMesh", description="Active base mesh name")
    version: str = Field(default="2.0.1")

    macros: MacroValues = Field(default_factory=MacroValues)
    modifiers: Dict[str, float] = Field(
        default_factory=dict,
        description="All non-macro modifier values keyed by target path, value 0.0–1.0",
    )
    equipment: EquipmentState = Field(default_factory=EquipmentState)
    measurements: Optional[MeasurementData] = None

    active_skeleton: Optional[str] = Field(
        default=None, alias="activeSkeleton",
        description="Name of currently active rig/skeleton",
    )
    active_pose: Optional[str] = Field(default=None, alias="activePose")

    tags: List[str] = Field(default_factory=list, description="User-defined tags")
    description: str = Field(default="")

    class Config:
        populate_by_name = True


class CharacterModel(BaseModel):
    """API representation returned by GET /character."""
    info: CharacterInfo
    is_dirty: bool = Field(
        default=False, alias="isDirty",
        description="True when unsaved changes exist",
    )
    file_path: Optional[str] = Field(default=None, alias="filePath")

    class Config:
        populate_by_name = True


class CharacterSummary(BaseModel):
    """Lightweight summary for list endpoints."""
    name: str
    base_mesh: str = Field(alias="baseMesh")
    file_path: Optional[str] = Field(default=None, alias="filePath")
    thumbnail: Optional[str] = Field(
        default=None, description="Base64-encoded thumbnail PNG",
    )

    class Config:
        populate_by_name = True


class CharacterCreateRequest(BaseModel):
    """Request body for POST /character/new."""
    name: str = Field(default="untitled")
    base_mesh: str = Field(default="hm08", alias="baseMesh")
    randomize: bool = False

    class Config:
        populate_by_name = True


class CharacterLoadRequest(BaseModel):
    """Request body for POST /character/load."""
    file_path: str = Field(..., alias="filePath", description="Absolute path to .mhm file")

    class Config:
        populate_by_name = True


class CharacterSaveRequest(BaseModel):
    """Request body for POST /character/save."""
    file_path: Optional[str] = Field(default=None, alias="filePath")
    name: Optional[str] = None

    class Config:
        populate_by_name = True


class RandomizeRequest(BaseModel):
    """Parameters for character randomization."""
    seed: Optional[int] = None
    preserve_gender: bool = Field(default=False, alias="preserveGender")
    preserve_age: bool = Field(default=False, alias="preserveAge")
    max_deviation: float = Field(
        default=0.5, alias="maxDeviation", ge=0.0, le=1.0,
        description="Maximum deviation from defaults",
    )

    class Config:
        populate_by_name = True
