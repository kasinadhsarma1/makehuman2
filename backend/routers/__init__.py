from .character import router as character_router
from .morphs import router as morphs_router
from .assets import router as assets_router
from .skeleton import router as skeleton_router
from .export import router as export_router
from .materials import router as materials_router
from .info import router as info_router
from .mesh import router as mesh_router

__all__ = [
    "character_router",
    "morphs_router",
    "assets_router",
    "skeleton_router",
    "export_router",
    "materials_router",
    "info_router",
    "mesh_router",
]
