"""
Material data models for MakeHuman2 API.

Mirrors opengl/material.py and .mhmat file format.
"""
from __future__ import annotations

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class ShaderType(str, Enum):
    PHONG = "phong"
    PBR = "pbr"
    LITSPHERE = "litsphere"
    TOON = "toon"


class RGBColor(BaseModel):
    r: float = Field(ge=0.0, le=1.0)
    g: float = Field(ge=0.0, le=1.0)
    b: float = Field(ge=0.0, le=1.0)


class TextureSlot(BaseModel):
    """A single texture slot."""
    path: Optional[str] = None
    enabled: bool = True
    intensity: float = Field(default=1.0, ge=0.0, le=1.0)


class MaterialModel(BaseModel):
    """Full material description — covers all shader types."""
    name: str
    shader: ShaderType = ShaderType.PHONG

    # --- Texture maps ---
    diffuse_texture: Optional[TextureSlot] = Field(default=None, alias="diffuseTexture")
    normal_map: Optional[TextureSlot] = Field(default=None, alias="normalMap")
    ao_map: Optional[TextureSlot] = Field(default=None, alias="aoMap")
    mr_map: Optional[TextureSlot] = Field(
        default=None, alias="mrMap",
        description="Metallic-Roughness map (PBR)",
    )
    emission_map: Optional[TextureSlot] = Field(default=None, alias="emissionMap")

    # --- Color properties ---
    diffuse_color: RGBColor = Field(
        default_factory=lambda: RGBColor(r=0.8, g=0.8, b=0.8),
        alias="diffuseColor",
    )
    specular_color: RGBColor = Field(
        default_factory=lambda: RGBColor(r=1.0, g=1.0, b=1.0),
        alias="specularColor",
    )
    emissive_color: RGBColor = Field(
        default_factory=lambda: RGBColor(r=0.0, g=0.0, b=0.0),
        alias="emissiveColor",
    )

    # --- PBR properties ---
    metallic_factor: float = Field(default=0.0, alias="metallicFactor", ge=0.0, le=1.0)
    roughness_factor: float = Field(default=0.5, alias="roughnessFactor", ge=0.0, le=1.0)

    # --- Phong properties ---
    specular_focus: float = Field(default=30.0, alias="specularFocus", ge=1.0)

    # --- Alpha / blending ---
    transparent: bool = False
    alpha: float = Field(default=1.0, ge=0.0, le=1.0)
    alpha_to_coverage: bool = Field(default=False, alias="alphaToCoverage")
    backface_cull: bool = Field(default=True, alias="backfaceCull")

    # --- Normal / AO intensities ---
    normalmap_intensity: float = Field(default=1.0, alias="normalmapIntensity", ge=0.0, le=1.0)
    aomap_intensity: float = Field(default=1.0, alias="aomapIntensity", ge=0.0, le=1.0)

    class Config:
        populate_by_name = True


class MaterialUpdate(BaseModel):
    """Partial update for a material — only provided fields change."""
    shader: Optional[ShaderType] = None
    diffuse_color: Optional[RGBColor] = Field(default=None, alias="diffuseColor")
    specular_color: Optional[RGBColor] = Field(default=None, alias="specularColor")
    emissive_color: Optional[RGBColor] = Field(default=None, alias="emissiveColor")
    metallic_factor: Optional[float] = Field(default=None, alias="metallicFactor")
    roughness_factor: Optional[float] = Field(default=None, alias="roughnessFactor")
    transparent: Optional[bool] = None
    alpha: Optional[float] = None
    backface_cull: Optional[bool] = Field(default=None, alias="backfaceCull")
    diffuse_texture: Optional[str] = Field(
        default=None, alias="diffuseTexture",
        description="Path to new diffuse texture file",
    )

    class Config:
        populate_by_name = True


class MaterialListItem(BaseModel):
    """Lightweight material entry for list endpoints."""
    name: str
    file_path: str = Field(alias="filePath")
    shader: ShaderType
    has_diffuse_texture: bool = Field(alias="hasDiffuseTexture")
    thumbnail: Optional[str] = Field(default=None, description="Base64-encoded thumbnail")

    class Config:
        populate_by_name = True
