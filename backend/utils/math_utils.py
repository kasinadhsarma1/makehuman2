"""
Math utilities for MakeHuman2 backend.

Mirrors core/math.py (Quaternion, matrix helpers) plus NumPy-based
mesh math (normals, transforms) from obj3d/object3d.py.
"""
from __future__ import annotations

import math
from typing import List, Sequence

import numpy as np


class MathUtils:
    """Static collection of math helpers used throughout the backend."""

    # ------------------------------------------------------------------
    # Vector helpers
    # ------------------------------------------------------------------

    @staticmethod
    def vec3_length(v: Sequence[float]) -> float:
        return math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2)

    @staticmethod
    def vec3_normalize(v: Sequence[float]) -> List[float]:
        length = MathUtils.vec3_length(v)
        if length < 1e-9:
            return [0.0, 0.0, 1.0]
        return [v[0] / length, v[1] / length, v[2] / length]

    @staticmethod
    def vec3_cross(a: Sequence[float], b: Sequence[float]) -> List[float]:
        return [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0],
        ]

    @staticmethod
    def vec3_dot(a: Sequence[float], b: Sequence[float]) -> float:
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

    # ------------------------------------------------------------------
    # Matrix helpers (4x4, row-major flat list ↔ numpy 4x4)
    # ------------------------------------------------------------------

    @staticmethod
    def mat4_identity() -> List[float]:
        """Return a flat 16-element identity matrix."""
        m = [0.0] * 16
        m[0] = m[5] = m[10] = m[15] = 1.0
        return m

    @staticmethod
    def mat4_to_numpy(flat: List[float]) -> np.ndarray:
        return np.array(flat, dtype=np.float32).reshape(4, 4)

    @staticmethod
    def numpy_to_mat4(mat: np.ndarray) -> List[float]:
        return mat.flatten().tolist()

    @staticmethod
    def mat4_multiply(a: List[float], b: List[float]) -> List[float]:
        ma = np.array(a, dtype=np.float64).reshape(4, 4)
        mb = np.array(b, dtype=np.float64).reshape(4, 4)
        return (ma @ mb).flatten().tolist()

    @staticmethod
    def mat4_invert(flat: List[float]) -> List[float]:
        mat = np.array(flat, dtype=np.float64).reshape(4, 4)
        try:
            return np.linalg.inv(mat).flatten().tolist()
        except np.linalg.LinAlgError:
            return MathUtils.mat4_identity()

    # ------------------------------------------------------------------
    # Euler / Quaternion conversions
    # ------------------------------------------------------------------

    @staticmethod
    def euler_to_quat(rx: float, ry: float, rz: float, order: str = "xyz") -> List[float]:
        """
        Convert Euler angles (degrees) to quaternion [x, y, z, w].
        Default rotation order matches MakeHuman's convention.
        """
        cx = math.cos(math.radians(rx) * 0.5)
        sx = math.sin(math.radians(rx) * 0.5)
        cy = math.cos(math.radians(ry) * 0.5)
        sy = math.sin(math.radians(ry) * 0.5)
        cz = math.cos(math.radians(rz) * 0.5)
        sz = math.sin(math.radians(rz) * 0.5)

        if order == "xyz":
            qw = cx * cy * cz - sx * sy * sz
            qx = sx * cy * cz + cx * sy * sz
            qy = cx * sy * cz - sx * cy * sz
            qz = cx * cy * sz + sx * sy * cz
        elif order == "yzx":
            # MakeHuman BVH convention
            qw = cy * cz * cx - sy * sz * sx
            qx = cy * cz * sx + sy * sz * cx
            qy = sy * cz * cx + cy * sz * sx
            qz = cy * sz * cx - sy * cz * sx
        else:
            # Fallback to xyz
            qw = cx * cy * cz - sx * sy * sz
            qx = sx * cy * cz + cx * sy * sz
            qy = cx * sy * cz - sx * cy * sz
            qz = cx * cy * sz + sx * sy * cz

        return [qx, qy, qz, qw]

    @staticmethod
    def quat_to_euler(qx: float, qy: float, qz: float, qw: float) -> List[float]:
        """Convert quaternion to Euler angles [rx, ry, rz] in degrees."""
        sinr_cosp = 2.0 * (qw * qx + qy * qz)
        cosr_cosp = 1.0 - 2.0 * (qx * qx + qy * qy)
        rx = math.degrees(math.atan2(sinr_cosp, cosr_cosp))

        sinp = 2.0 * (qw * qy - qz * qx)
        ry = math.degrees(math.asin(max(-1.0, min(1.0, sinp))))

        siny_cosp = 2.0 * (qw * qz + qx * qy)
        cosy_cosp = 1.0 - 2.0 * (qy * qy + qz * qz)
        rz = math.degrees(math.atan2(siny_cosp, cosy_cosp))

        return [rx, ry, rz]

    @staticmethod
    def quat_to_mat4(qx: float, qy: float, qz: float, qw: float) -> List[float]:
        """Convert quaternion to 4x4 rotation matrix (flat, row-major)."""
        x2, y2, z2 = qx * 2, qy * 2, qz * 2
        xx, yy, zz = qx * x2, qy * y2, qz * z2
        xy, xz, yz = qx * y2, qx * z2, qy * z2
        wx, wy, wz = qw * x2, qw * y2, qw * z2
        return [
            1 - (yy + zz), xy - wz,       xz + wy,       0,
            xy + wz,       1 - (xx + zz), yz - wx,       0,
            xz - wy,       yz + wx,       1 - (xx + yy), 0,
            0,             0,             0,              1,
        ]

    # ------------------------------------------------------------------
    # Mesh-level operations
    # ------------------------------------------------------------------

    @staticmethod
    def calculate_vertex_normals(
        coords: np.ndarray,   # (N, 3) float32
        faces: np.ndarray,    # (F, 3) uint32  — triangle indices
    ) -> np.ndarray:
        """
        Compute per-vertex normals by averaging incident face normals.
        Returns (N, 3) float32 array.
        """
        normals = np.zeros_like(coords, dtype=np.float64)
        v0 = coords[faces[:, 0]]
        v1 = coords[faces[:, 1]]
        v2 = coords[faces[:, 2]]
        face_normals = np.cross(v1 - v0, v2 - v0)  # (F, 3)
        for i in range(3):
            np.add.at(normals, faces[:, i], face_normals)
        lengths = np.linalg.norm(normals, axis=1, keepdims=True)
        lengths[lengths < 1e-9] = 1.0
        return (normals / lengths).astype(np.float32)

    @staticmethod
    def apply_morph_target(
        coords: np.ndarray,            # (N, 3) float32 — current mesh coords
        displacements: dict,           # {vertex_index: [dx, dy, dz]}
        amount: float,                 # -1.0 to 1.0
    ) -> np.ndarray:
        """
        Apply a morph target displacement scaled by amount.
        Returns a new (N, 3) array (does not mutate input).
        """
        result = coords.copy()
        for idx_str, disp in displacements.items():
            idx = int(idx_str)
            if 0 <= idx < len(result):
                result[idx] += np.array(disp, dtype=np.float32) * amount
        return result

    @staticmethod
    def skin_vertices(
        coords: np.ndarray,            # (N, 3) rest-pose vertices
        bone_matrices: List[np.ndarray],  # list of (4, 4) pose matrices
        joint_indices: np.ndarray,     # (N, K) int  — K joints per vertex
        weights: np.ndarray,           # (N, K) float
    ) -> np.ndarray:
        """
        Linear blend skinning: deform vertices by weighted bone transforms.
        Returns (N, 3) float32 posed vertices.
        """
        N = coords.shape[0]
        posed = np.zeros((N, 3), dtype=np.float64)
        coords_h = np.hstack([coords, np.ones((N, 1), dtype=np.float64)])  # (N, 4)
        for bone_idx, mat in enumerate(bone_matrices):
            mask = np.any(joint_indices == bone_idx, axis=1)
            if not np.any(mask):
                continue
            wi = weights[mask]
            ci = coords_h[mask]
            w = wi[:, np.where(joint_indices[mask] == bone_idx)[1]]
            transformed = (mat @ ci.T).T[:, :3]  # (M, 3)
            posed[mask] += transformed * w
        return posed.astype(np.float32)
