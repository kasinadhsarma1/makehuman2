"""
Asset data models for MakeHuman2 API.

Covers all equipment types: clothes, hair, eyes, proxies, skins, poses, rigs.
Mirrors core/globenv.py asset cache entries and core/taglogic.py filtering.
"""
from __future__ import annotations

from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class AssetType(str, Enum):
    CLOTHES = "clothes"
    HAIR = "hair"
    EYES = "eyes"
    EYEBROWS = "eyebrows"
    EYELASHES = "eyelashes"
    TEETH = "teeth"
    TONGUE = "tongue"
    PROXY = "proxy"
    SKIN = "skin"
    POSE = "pose"
    RIG = "rig"
    EXPRESSION = "expression"
    TARGET = "target"


class EquipmentSlot(str, Enum):
    """Mutually-exclusive equipment slots on the character."""
    HAIR = "hair"
    EYES = "eyes"
    EYEBROWS = "eyebrows"
    EYELASHES = "eyelashes"
    TEETH = "teeth"
    TONGUE = "tongue"
    PROXY = "proxy"
    # Clothes are multi-slot (multiple items allowed)


class AssetModel(BaseModel):
    """Full asset record matching the SQLite cache schema."""
    uuid: Optional[str] = None
    name: str
    asset_type: AssetType = Field(alias="assetType")
    file_path: str = Field(alias="filePath")
    base_mesh: str = Field(default="hm08", alias="baseMesh")

    tags: List[str] = Field(default_factory=list)
    license: Optional[str] = None
    author: Optional[str] = None
    description: str = ""

    thumbnail: Optional[str] = Field(
        default=None,
        description="Base64-encoded PNG thumbnail",
    )
    material_file: Optional[str] = Field(
        default=None, alias="materialFile",
        description="Default .mhmat file path",
    )

    is_installed: bool = Field(default=True, alias="isInstalled")
    is_system: bool = Field(default=False, alias="isSystem",
                            description="True for assets in the system data dir")

    class Config:
        populate_by_name = True


class AssetFilter(BaseModel):
    """Query filter for asset list endpoints."""
    asset_type: Optional[AssetType] = Field(default=None, alias="assetType")
    base_mesh: Optional[str] = Field(default=None, alias="baseMesh")
    tags: List[str] = Field(default_factory=list)
    search: Optional[str] = Field(
        default=None, description="Substring search on name",
    )
    installed_only: bool = Field(default=True, alias="installedOnly")
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=50, alias="pageSize", ge=1, le=200)

    class Config:
        populate_by_name = True


class AssetListResponse(BaseModel):
    """Paginated asset list response."""
    total: int
    page: int
    page_size: int = Field(alias="pageSize")
    items: List[AssetModel]

    class Config:
        populate_by_name = True


class AssetApplyRequest(BaseModel):
    """Request to apply/equip an asset to the character."""
    asset_name: Optional[str] = Field(default=None, alias="assetName")
    asset_uuid: Optional[str] = Field(default=None, alias="assetUuid")
    file_path: Optional[str] = Field(
        default=None, alias="filePath",
        description="Explicit file path (overrides name/uuid lookup)",
    )
    material_override: Optional[str] = Field(
        default=None, alias="materialOverride",
        description="Override the default material with this .mhmat path",
    )

    class Config:
        populate_by_name = True


class AssetRemoveRequest(BaseModel):
    """Request to remove an equipped asset."""
    asset_name: str = Field(alias="assetName")
    asset_type: AssetType = Field(alias="assetType")

    class Config:
        populate_by_name = True


class DownloadRequest(BaseModel):
    """Request to download an asset from the repository."""
    url: str
    asset_type: AssetType = Field(alias="assetType")
    name: Optional[str] = None

    class Config:
        populate_by_name = True


class DownloadStatus(BaseModel):
    """Progress report for an ongoing download."""
    task_id: str = Field(alias="taskId")
    name: str
    progress: float = Field(ge=0.0, le=1.0)
    status: str = Field(description="pending | downloading | completed | failed")
    error: Optional[str] = None

    class Config:
        populate_by_name = True
