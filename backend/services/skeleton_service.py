"""
Skeleton and pose service for MakeHuman2 backend.

Mirrors obj3d/skeleton.py (skeleton, cBone) and obj3d/animation.py (BVH).
"""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np

from ..models.skeleton import (
    BoneModel,
    BoneOverrideRequest,
    JointPosition,
    PoseApplyRequest,
    PoseFrame,
    PoseModel,
    SkeletonListItem,
    SkeletonModel,
)
from ..utils.file_helpers import DATA_DIR, FileHelpers, get_base_mesh_dir
from ..utils.math_utils import MathUtils

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# In-memory skeleton state
# ---------------------------------------------------------------------------
_current_skeleton: Optional[SkeletonModel] = None
_current_pose: Optional[PoseModel] = None
_bone_overrides: Dict[str, List[float]] = {}  # bone_name → [rx, ry, rz]


class SkeletonService:
    """Static service for skeleton and pose management."""

    # ------------------------------------------------------------------
    # Available skeletons
    # ------------------------------------------------------------------

    @classmethod
    def list_skeletons(cls, base_mesh: str = "hm08") -> List[SkeletonListItem]:
        rig_dir = DATA_DIR / "rigs" / base_mesh
        if not rig_dir.exists():
            rig_dir = DATA_DIR / "rigs"
        items: List[SkeletonListItem] = []
        for skel_file in sorted(rig_dir.rglob("*.mhskel")):
            try:
                skel_data = FileHelpers.read_json(skel_file)
                bone_count = len(skel_data.get("bones", {}))
                items.append(SkeletonListItem(
                    name=skel_data.get("name", skel_file.stem),
                    file_path=str(skel_file),
                    bone_count=bone_count,
                    description=skel_data.get("description", ""),
                ))
            except Exception as exc:
                logger.warning("Failed to read skeleton %s: %s", skel_file, exc)
        return items

    # ------------------------------------------------------------------
    # Load skeleton
    # ------------------------------------------------------------------

    @classmethod
    def load_skeleton(cls, skel_path: str, base_mesh: str = "hm08") -> SkeletonModel:
        """Parse a .mhskel file and return a SkeletonModel."""
        p = Path(skel_path)
        if not p.exists():
            # Try in data/rigs
            for candidate in [
                DATA_DIR / "rigs" / base_mesh / skel_path,
                DATA_DIR / "rigs" / skel_path,
            ]:
                if candidate.exists():
                    p = candidate
                    break
            else:
                raise FileNotFoundError(f"Skeleton file not found: {skel_path}")

        data = FileHelpers.read_json(p)
        bones_raw = data.get("bones", {})
        joints_raw = data.get("joints", {})
        planes = data.get("planes", {})

        bones: Dict[str, BoneModel] = {}
        for bone_name, bdata in bones_raw.items():
            bones[bone_name] = BoneModel(
                name=bone_name,
                parent=bdata.get("parent"),
                children=bdata.get("children", []),
                head_joint=bdata.get("head", bone_name),
                tail_joint=bdata.get("tail", bone_name),
            )

        # Build child lists from parent references
        for bone_name, bone in bones.items():
            if bone.parent and bone.parent in bones:
                parent_bone = bones[bone.parent]
                if bone_name not in parent_bone.children:
                    parent_bone.children.append(bone_name)

        # Determine root
        root = next(
            (name for name, b in bones.items() if b.parent is None),
            next(iter(bones), "root"),
        )

        # Joint positions (from vertex averages — placeholder)
        joints: Dict[str, JointPosition] = {}
        for jname, verts in joints_raw.items():
            joints[jname] = JointPosition(name=jname, position=[0.0, 0.0, 0.0])

        skeleton = SkeletonModel(
            name=data.get("name", p.stem),
            root_bone=root,
            bones=bones,
            joints=joints,
            weights_file=data.get("weights_file"),
        )
        _current_skeleton = skeleton
        return skeleton

    @classmethod
    def get_current_skeleton(cls) -> Optional[SkeletonModel]:
        return _current_skeleton

    # ------------------------------------------------------------------
    # Available poses
    # ------------------------------------------------------------------

    @classmethod
    def list_poses(cls, base_mesh: str = "hm08") -> List[Dict[str, str]]:
        pose_dir = DATA_DIR / "poses"
        items = []
        if pose_dir.exists():
            for f in sorted(pose_dir.rglob("*.bvh")):
                items.append({"name": f.stem, "file_path": str(f), "format": "bvh"})
            for f in sorted(pose_dir.rglob("*.mhpose")):
                items.append({"name": f.stem, "file_path": str(f), "format": "mhpose"})
        return items

    # ------------------------------------------------------------------
    # Apply pose
    # ------------------------------------------------------------------

    @classmethod
    def apply_pose(cls, request: PoseApplyRequest) -> Optional[PoseModel]:
        """Load and apply a pose from file or by name."""
        global _current_pose, _bone_overrides

        if request.pose_file:
            pose_path = Path(request.pose_file)
        elif request.pose_name:
            pose_path = cls._find_pose_file(request.pose_name)
        else:
            return None

        if pose_path is None or not pose_path.exists():
            raise FileNotFoundError(f"Pose file not found: {request.pose_file or request.pose_name}")

        if pose_path.suffix.lower() == ".bvh":
            pose = cls._load_bvh(pose_path, request.frame_index)
        else:
            pose = cls._load_mhpose(pose_path)

        _current_pose = pose
        _bone_overrides.clear()
        return pose

    @classmethod
    def reset_pose(cls) -> None:
        global _current_pose, _bone_overrides
        _current_pose = None
        _bone_overrides.clear()

    @classmethod
    def override_bone(cls, req: BoneOverrideRequest) -> bool:
        """Manually override a single bone's rotation."""
        _bone_overrides[req.bone_name] = req.rotation
        return True

    @classmethod
    def get_current_pose(cls) -> Optional[PoseModel]:
        return _current_pose

    # ------------------------------------------------------------------
    # BVH parser
    # ------------------------------------------------------------------

    @classmethod
    def _load_bvh(cls, path: Path, frame_index: int = 0) -> PoseModel:
        """
        Minimal BVH parser — reads hierarchy and motion data.
        Returns a PoseModel with a single frame.
        """
        joints: Dict[str, Dict[str, Any]] = {}
        joint_order: List[str] = []
        channels: Dict[str, List[str]] = {}
        frames: List[List[float]] = []
        frame_time = 1 / 24.0

        with path.open("r", encoding="utf-8") as fh:
            lines = [l.strip() for l in fh]

        i, current_joint = 0, None
        in_motion = False

        while i < len(lines):
            line = lines[i]
            tokens = line.split()
            if not tokens:
                i += 1
                continue

            if tokens[0] in ("ROOT", "JOINT"):
                current_joint = tokens[1]
                joint_order.append(current_joint)
                joints[current_joint] = {"parent": None, "offset": [0, 0, 0]}
                if len(joint_order) > 1 and tokens[0] == "JOINT":
                    # Find parent by bracket depth — simplified
                    joints[current_joint]["parent"] = joint_order[-2]

            elif tokens[0] == "OFFSET" and current_joint:
                joints[current_joint]["offset"] = [float(x) for x in tokens[1:4]]

            elif tokens[0] == "CHANNELS" and current_joint:
                count = int(tokens[1])
                channels[current_joint] = tokens[2: 2 + count]

            elif tokens[0] == "End":
                current_joint = None

            elif tokens[0] == "MOTION":
                in_motion = True

            elif in_motion and tokens[0] == "Frames:":
                pass  # frame count

            elif in_motion and tokens[0] == "Frame" and tokens[1] == "Time:":
                frame_time = float(tokens[2])

            elif in_motion and all(cls._is_float(t) for t in tokens):
                frames.append([float(t) for t in tokens])

            i += 1

        # Extract rotations from the target frame
        target_frame = frames[min(frame_index, len(frames) - 1)] if frames else []
        bone_rotations: Dict[str, List[float]] = {}
        offset = 0
        for jname in joint_order:
            chans = channels.get(jname, [])
            rot = [0.0, 0.0, 0.0]
            for ch in chans:
                val = target_frame[offset] if offset < len(target_frame) else 0.0
                if ch == "Xrotation":
                    rot[0] = val
                elif ch == "Yrotation":
                    rot[1] = val
                elif ch == "Zrotation":
                    rot[2] = val
                offset += 1
            bone_rotations[jname] = rot

        return PoseModel(
            name=path.stem,
            source_file=str(path),
            frame_count=len(frames),
            frame_time=frame_time,
            frames=[PoseFrame(
                frame_index=frame_index,
                bone_rotations=bone_rotations,
            )],
        )

    @classmethod
    def _load_mhpose(cls, path: Path) -> PoseModel:
        """Load a .mhpose (JSON) file."""
        data = FileHelpers.read_json(path)
        bone_rotations: Dict[str, List[float]] = {}
        for bone_name, rot_data in data.get("bones", {}).items():
            bone_rotations[bone_name] = rot_data if isinstance(rot_data, list) else [0, 0, 0]
        return PoseModel(
            name=data.get("name", path.stem),
            source_file=str(path),
            frame_count=1,
            frames=[PoseFrame(frame_index=0, bone_rotations=bone_rotations)],
        )

    @staticmethod
    def _find_pose_file(name: str) -> Optional[Path]:
        pose_dir = DATA_DIR / "poses"
        for ext in (".bvh", ".mhpose"):
            p = pose_dir / (name + ext)
            if p.exists():
                return p
            for match in pose_dir.rglob(name + ext):
                return match
        return None

    @staticmethod
    def _is_float(s: str) -> bool:
        try:
            float(s)
            return True
        except ValueError:
            return False
