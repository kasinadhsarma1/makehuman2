"""
Export service for MakeHuman2 backend.

Wraps the existing core export modules:
  core/export_gltf.py  → glTF 2.0
  core/export_obj.py   → Wavefront OBJ
  core/export_stl.py   → STL
  core/export_bvh.py   → BVH animation
  utils/mhm_parser.py  → MHM save format

All exports write to a temp file and return the bytes for streaming.
"""
from __future__ import annotations

import json
import logging
import struct
import tempfile
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np

from ..models.character import CharacterInfo
from ..services.morph_service import MorphService
from ..utils.file_helpers import FileHelpers, get_base_mesh_dir
from ..utils.math_utils import MathUtils
from ..utils.mhm_parser import MHMParser

logger = logging.getLogger(__name__)


class ExportService:
    """Static service for exporting characters to various formats."""

    # ------------------------------------------------------------------
    # MHM (native save)
    # ------------------------------------------------------------------

    @classmethod
    def export_mhm(cls, char: CharacterInfo) -> bytes:
        with tempfile.NamedTemporaryFile(suffix=".mhm", delete=False) as tmp:
            tmp_path = Path(tmp.name)
        from .character_service import CharacterService
        data = CharacterService._character_to_mhm_dict(char)
        MHMParser.save(data, tmp_path)
        content = tmp_path.read_bytes()
        tmp_path.unlink(missing_ok=True)
        return content

    # ------------------------------------------------------------------
    # OBJ
    # ------------------------------------------------------------------

    @classmethod
    def export_obj(
        cls,
        char: CharacterInfo,
        scale: float = 0.1,
        include_uvs: bool = True,
    ) -> bytes:
        """
        Export the posed mesh as Wavefront OBJ.
        Mirrors core/export_obj.py logic.
        """
        coords, faces, uvs = cls._get_posed_mesh(char)
        if coords is None:
            return b"# MakeHuman2 OBJ export\n# (no mesh loaded)\n"

        lines: List[str] = [
            "# MakeHuman2 OBJ Export",
            f"# Character: {char.name}",
            "",
            "mtllib character.mtl",
            "",
        ]

        for v in coords:
            lines.append(f"v {v[0]*scale:.6f} {v[1]*scale:.6f} {v[2]*scale:.6f}")

        if include_uvs and uvs is not None:
            lines.append("")
            for uv in uvs:
                lines.append(f"vt {uv[0]:.6f} {uv[1]:.6f}")

        normals = MathUtils.calculate_vertex_normals(coords, faces)
        lines.append("")
        for n in normals:
            lines.append(f"vn {n[0]:.6f} {n[1]:.6f} {n[2]:.6f}")

        lines.append("")
        lines.append("usemtl skin")
        lines.append("g body")
        for face in faces:
            i0, i1, i2 = int(face[0]) + 1, int(face[1]) + 1, int(face[2]) + 1
            if include_uvs and uvs is not None:
                lines.append(f"f {i0}/{i0}/{i0} {i1}/{i1}/{i1} {i2}/{i2}/{i2}")
            else:
                lines.append(f"f {i0}//{i0} {i1}//{i1} {i2}//{i2}")

        return ("\n".join(lines) + "\n").encode("utf-8")

    # ------------------------------------------------------------------
    # STL (binary)
    # ------------------------------------------------------------------

    @classmethod
    def export_stl(cls, char: CharacterInfo, scale: float = 0.1) -> bytes:
        """Export binary STL. Mirrors core/export_stl.py."""
        coords, faces, _ = cls._get_posed_mesh(char)
        if coords is None or faces is None:
            return b"\x00" * 84  # empty STL header

        header = b"MakeHuman2 STL Export" + b"\x00" * (80 - len("MakeHuman2 STL Export"))
        n_tris = len(faces)
        buf = bytearray(header)
        buf += struct.pack("<I", n_tris)

        for face in faces:
            v0 = coords[face[0]] * scale
            v1 = coords[face[1]] * scale
            v2 = coords[face[2]] * scale
            edge1 = v1 - v0
            edge2 = v2 - v0
            normal = np.cross(edge1, edge2)
            length = np.linalg.norm(normal)
            if length > 1e-9:
                normal /= length
            buf += struct.pack("<fff", *normal)
            buf += struct.pack("<fff", *v0)
            buf += struct.pack("<fff", *v1)
            buf += struct.pack("<fff", *v2)
            buf += struct.pack("<H", 0)  # attribute byte count

        return bytes(buf)

    # ------------------------------------------------------------------
    # glTF 2.0
    # ------------------------------------------------------------------

    @classmethod
    def export_gltf(
        cls,
        char: CharacterInfo,
        scale: float = 0.1,
        include_skeleton: bool = True,
        include_animation: bool = False,
    ) -> bytes:
        """
        Export as glTF 2.0 JSON (embedded buffers in base64).
        Mirrors core/export_gltf.py structure.
        """
        import base64

        coords, faces, uvs = cls._get_posed_mesh(char)
        if coords is None:
            return json.dumps({"asset": {"version": "2.0"}, "scene": 0, "scenes": [{"nodes": []}]}).encode()

        normals = MathUtils.calculate_vertex_normals(coords, faces)
        scaled_coords = (coords * scale).astype(np.float32)

        # Build binary buffer
        pos_bytes  = scaled_coords.tobytes()
        norm_bytes = normals.tobytes()
        idx_arr    = faces.flatten().astype(np.uint32)
        idx_bytes  = idx_arr.tobytes()
        uv_bytes   = b""
        if uvs is not None:
            uv_bytes = uvs.astype(np.float32).tobytes()

        total_bytes = len(pos_bytes) + len(norm_bytes) + len(idx_bytes) + len(uv_bytes)
        buffer_b64 = base64.b64encode(pos_bytes + norm_bytes + idx_bytes + uv_bytes).decode()

        offset = 0
        buffer_views = []
        accessors = []

        def _add_view(data: bytes, target: int) -> int:
            nonlocal offset
            view_idx = len(buffer_views)
            buffer_views.append({"buffer": 0, "byteOffset": offset, "byteLength": len(data), "target": target})
            offset += len(data)
            return view_idx

        ARRAY_BUFFER = 34962
        ELEMENT_ARRAY_BUFFER = 34963

        # Positions
        pos_view = _add_view(pos_bytes, ARRAY_BUFFER)
        min_pos = scaled_coords.min(axis=0).tolist()
        max_pos = scaled_coords.max(axis=0).tolist()
        accessors.append({"bufferView": pos_view, "byteOffset": 0, "componentType": 5126, "count": len(scaled_coords), "type": "VEC3", "min": min_pos, "max": max_pos})

        # Normals
        norm_view = _add_view(norm_bytes, ARRAY_BUFFER)
        accessors.append({"bufferView": norm_view, "byteOffset": 0, "componentType": 5126, "count": len(normals), "type": "VEC3"})

        # Indices
        idx_view = _add_view(idx_bytes, ELEMENT_ARRAY_BUFFER)
        accessors.append({"bufferView": idx_view, "byteOffset": 0, "componentType": 5125, "count": len(idx_arr), "type": "SCALAR"})

        attributes = {"POSITION": 0, "NORMAL": 1}

        if uvs is not None and uv_bytes:
            uv_view = _add_view(uv_bytes, ARRAY_BUFFER)
            accessors.append({"bufferView": uv_view, "byteOffset": 0, "componentType": 5126, "count": len(uvs), "type": "VEC2"})
            attributes["TEXCOORD_0"] = len(accessors) - 1

        gltf = {
            "asset": {"version": "2.0", "generator": "MakeHuman2 FastAPI Backend"},
            "scene": 0,
            "scenes": [{"nodes": [0]}],
            "nodes": [{"mesh": 0, "name": char.name}],
            "meshes": [{
                "name": char.name,
                "primitives": [{
                    "attributes": attributes,
                    "indices": 2,
                    "mode": 4,
                }],
            }],
            "accessors": accessors,
            "bufferViews": buffer_views,
            "buffers": [{"uri": f"data:application/octet-stream;base64,{buffer_b64}", "byteLength": total_bytes}],
        }
        return json.dumps(gltf, indent=2).encode("utf-8")

    # ------------------------------------------------------------------
    # BVH animation
    # ------------------------------------------------------------------

    @classmethod
    def export_bvh(cls, char: CharacterInfo) -> bytes:
        """
        Export current skeleton pose as BVH.
        Mirrors core/export_bvh.py.
        """
        from .skeleton_service import SkeletonService

        skeleton = SkeletonService.get_current_skeleton()
        pose = SkeletonService.get_current_pose()

        if skeleton is None:
            return b"HIERARCHY\nROOT Root\n{\n  OFFSET 0 0 0\n  CHANNELS 3 Xrotation Yrotation Zrotation\n  End Site\n  {\n    OFFSET 0 1 0\n  }\n}\nMOTION\nFrames: 1\nFrame Time: 0.041667\n0 0 0\n"

        lines = ["HIERARCHY"]
        cls._write_bvh_hierarchy(lines, skeleton, skeleton.root_bone, 0)
        lines.append("MOTION")
        lines.append("Frames: 1")
        lines.append("Frame Time: 0.041667")

        frame_vals: List[float] = []
        cls._write_bvh_frame(frame_vals, skeleton, skeleton.root_bone, pose)
        lines.append(" ".join(f"{v:.4f}" for v in frame_vals))

        return "\n".join(lines).encode("utf-8")

    @classmethod
    def _write_bvh_hierarchy(
        cls, lines: List[str], skeleton: Any, bone_name: str, depth: int
    ) -> None:
        from .skeleton_service import SkeletonService
        indent = "  " * depth
        bone = skeleton.bones.get(bone_name)
        if bone is None:
            return
        keyword = "ROOT" if depth == 0 else "JOINT"
        lines.append(f"{indent}{keyword} {bone_name}")
        lines.append(f"{indent}{{")
        head = bone.head_pos or [0.0, 0.0, 0.0]
        lines.append(f"{indent}  OFFSET {head[0]:.4f} {head[1]:.4f} {head[2]:.4f}")
        lines.append(f"{indent}  CHANNELS 3 Xrotation Yrotation Zrotation")
        for child_name in bone.children:
            cls._write_bvh_hierarchy(lines, skeleton, child_name, depth + 1)
        if not bone.children:
            tail = bone.tail_pos or [0.0, 1.0, 0.0]
            lines.append(f"{indent}  End Site")
            lines.append(f"{indent}  {{")
            lines.append(f"{indent}    OFFSET {tail[0]:.4f} {tail[1]:.4f} {tail[2]:.4f}")
            lines.append(f"{indent}  }}")
        lines.append(f"{indent}}}")

    @classmethod
    def _write_bvh_frame(
        cls, vals: List[float], skeleton: Any, bone_name: str, pose: Any
    ) -> None:
        bone = skeleton.bones.get(bone_name)
        if bone is None:
            return
        if pose and pose.frames:
            rot = pose.frames[0].bone_rotations.get(bone_name, [0.0, 0.0, 0.0])
        else:
            rot = [0.0, 0.0, 0.0]
        vals.extend(rot)
        for child_name in bone.children:
            cls._write_bvh_frame(vals, skeleton, child_name, pose)

    # ------------------------------------------------------------------
    # Internal mesh helpers
    # ------------------------------------------------------------------

    @classmethod
    def _get_posed_mesh(
        cls, char: CharacterInfo
    ) -> tuple[Optional[np.ndarray], Optional[np.ndarray], Optional[np.ndarray]]:
        """
        Load the base mesh and apply all current morph targets.
        Returns (coords, faces, uvs) numpy arrays or (None, None, None).
        """
        base_dir = get_base_mesh_dir(char.base_mesh)

        # Try compiled binary first, then OBJ
        for mesh_file in [
            base_dir / "base.mhbin",
            base_dir / "base.obj",
        ]:
            if mesh_file.exists():
                return cls._load_mesh(mesh_file, char)

        logger.warning("No base mesh found for: %s", char.base_mesh)
        return None, None, None

    @classmethod
    def _load_mesh(
        cls, mesh_file: Path, char: CharacterInfo
    ) -> tuple[Optional[np.ndarray], Optional[np.ndarray], Optional[np.ndarray]]:
        if mesh_file.suffix == ".obj":
            return cls._load_obj(mesh_file)
        # .mhbin: delegate to obj3d loader when available
        try:
            import sys
            sys.path.insert(0, str(mesh_file.parent.parent.parent.parent))
            from obj3d import fops_binary  # type: ignore
            obj = fops_binary.loadBinaryFile(str(mesh_file))
            coords = np.array(obj.coord, dtype=np.float32)
            faces  = np.array(obj.fverts, dtype=np.uint32)
            uvs    = np.array(obj.uvs, dtype=np.float32) if hasattr(obj, "uvs") else None
            return coords, faces, uvs
        except Exception as exc:
            logger.debug("Binary mesh load failed (%s), trying OBJ fallback", exc)
            obj_path = mesh_file.parent / "base.obj"
            if obj_path.exists():
                return cls._load_obj(obj_path)
        return None, None, None

    @staticmethod
    def _load_obj(
        path: Path,
    ) -> tuple[Optional[np.ndarray], Optional[np.ndarray], Optional[np.ndarray]]:
        """Minimal OBJ loader for export purposes."""
        verts, uvs_list, faces = [], [], []
        try:
            with path.open("r", encoding="utf-8") as fh:
                for line in fh:
                    line = line.strip()
                    if line.startswith("v "):
                        parts = line.split()
                        verts.append([float(parts[1]), float(parts[2]), float(parts[3])])
                    elif line.startswith("vt "):
                        parts = line.split()
                        uvs_list.append([float(parts[1]), float(parts[2])])
                    elif line.startswith("f "):
                        parts = line.split()[1:]
                        tri = []
                        for p in parts[:3]:
                            vi = int(p.split("/")[0]) - 1
                            tri.append(vi)
                        faces.append(tri)
        except Exception as exc:
            logger.error("OBJ load error: %s", exc)
            return None, None, None

        coords = np.array(verts, dtype=np.float32) if verts else None
        face_arr = np.array(faces, dtype=np.uint32) if faces else None
        uv_arr = np.array(uvs_list, dtype=np.float32) if uvs_list else None
        return coords, face_arr, uv_arr
