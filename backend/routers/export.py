"""
Export router — download character in multiple 3D formats.

Endpoints:
  POST  /export/mhm     → MakeHuman native (.mhm) bytes
  POST  /export/obj     → Wavefront OBJ bytes
  POST  /export/stl     → Binary STL bytes
  POST  /export/gltf    → glTF 2.0 JSON bytes
  POST  /export/bvh     → BVH animation bytes
"""
from __future__ import annotations

from fastapi import APIRouter, Query
from fastapi.responses import Response

from ..services.character_service import CharacterService
from ..services.export_service import ExportService

router = APIRouter(prefix="/export", tags=["export"])


def _current_char():
    return CharacterService.get_character().info


@router.post("/mhm", summary="Export character as MakeHuman Model (.mhm)")
def export_mhm() -> Response:
    char = _current_char()
    data = ExportService.export_mhm(char)
    filename = f"{char.name or 'character'}.mhm"
    return Response(
        content=data,
        media_type="text/plain",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/obj", summary="Export character as Wavefront OBJ")
def export_obj(
    scale: float = Query(default=0.1, ge=0.001, le=100.0),
    include_uvs: bool = Query(default=True, alias="includeUVs"),
) -> Response:
    char = _current_char()
    data = ExportService.export_obj(char, scale=scale, include_uvs=include_uvs)
    filename = f"{char.name or 'character'}.obj"
    return Response(
        content=data,
        media_type="text/plain",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/stl", summary="Export character as binary STL")
def export_stl(
    scale: float = Query(default=0.1, ge=0.001, le=100.0),
) -> Response:
    char = _current_char()
    data = ExportService.export_stl(char, scale=scale)
    filename = f"{char.name or 'character'}.stl"
    return Response(
        content=data,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/gltf", summary="Export character as glTF 2.0 JSON")
def export_gltf(
    scale: float = Query(default=0.1, ge=0.001, le=100.0),
    include_skeleton: bool = Query(default=True, alias="includeSkeleton"),
    include_animation: bool = Query(default=False, alias="includeAnimation"),
) -> Response:
    char = _current_char()
    data = ExportService.export_gltf(
        char,
        scale=scale,
        include_skeleton=include_skeleton,
        include_animation=include_animation,
    )
    filename = f"{char.name or 'character'}.gltf"
    return Response(
        content=data,
        media_type="model/gltf+json",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/bvh", summary="Export current pose as BVH animation")
def export_bvh() -> Response:
    char = _current_char()
    data = ExportService.export_bvh(char)
    filename = f"{char.name or 'character'}.bvh"
    return Response(
        content=data,
        media_type="text/plain",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
