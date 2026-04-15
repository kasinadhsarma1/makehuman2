"""
Morph / target service for MakeHuman2 backend.

Mirrors core/target.py (Modelling, Morphtarget, Targets) and
core/targetcat.py (category tree).
"""
from __future__ import annotations

import logging
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

from ..models.morph import (
    MorphCategory,
    MorphModifier,
    MorphTarget,
    MorphValue,
)
from ..utils.file_helpers import get_target_dir

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# In-memory state (single character model)
# ---------------------------------------------------------------------------

# target_path → current value (0.0–1.0, default 0.5)
_modifier_values: Dict[str, float] = {}
# target_path → MorphModifier definition
_modifiers: Dict[str, MorphModifier] = {}
# Loaded (compiled) targets: target_file_name → {vertex_index: [dx,dy,dz]}
_target_cache: Dict[str, Dict[int, List[float]]] = {}


class MorphService:
    """Static service for morph target management."""

    # ------------------------------------------------------------------
    # Initialisation
    # ------------------------------------------------------------------

    @classmethod
    def load_target_repository(cls, base_mesh: str = "hm08") -> int:
        """
        Walk the target directory and build the in-memory modifier catalogue.
        Returns the number of modifiers found.
        """
        target_dir = get_target_dir()
        if not target_dir.exists():
            logger.warning("Target directory not found: %s", target_dir)
            return 0

        _modifiers.clear()
        _modifier_values.clear()

        count = 0
        for target_file in sorted(target_dir.rglob("*.target")):
            mod = cls._target_file_to_modifier(target_file, target_dir)
            if mod:
                _modifiers[mod.target_path] = mod
                _modifier_values[mod.target_path] = mod.default
                count += 1

        logger.info("Loaded %d morph modifiers", count)
        return count

    @classmethod
    def _target_file_to_modifier(
        cls, path: Path, root: Path
    ) -> Optional[MorphModifier]:
        """Convert a .target file path to a MorphModifier descriptor."""
        try:
            rel = path.relative_to(root)
        except ValueError:
            return None

        # e.g. macrodetails/gender-male-decr.target
        parts = rel.with_suffix("").parts  # ('macrodetails', 'gender-male-decr')
        if not parts:
            return None

        stem = parts[-1]
        group = "/".join(parts[:-1]) if len(parts) > 1 else "misc"

        # Detect incr/decr suffix
        incr_target = decr_target = None
        if stem.endswith("-incr"):
            base_name = stem[:-5]
            target_path = f"{group}/{base_name}"
            incr_target = path.name
            # Look for matching decr
            decr_path = path.parent / f"{base_name}-decr.target"
            if decr_path.exists():
                decr_target = decr_path.name
        elif stem.endswith("-decr"):
            # Will be picked up by the incr variant
            return None
        else:
            target_path = f"{group}/{stem}"
            incr_target = path.name

        display_name = stem.replace("-", " ").replace("_", " ").title()
        display_name = re.sub(r"\s+Incr$", "", display_name, flags=re.IGNORECASE)

        return MorphModifier(
            name=display_name,
            target_path=target_path,
            group=group,
            value=0.5,
            default=0.5,
            incr_target=incr_target,
            decr_target=decr_target,
        )

    # ------------------------------------------------------------------
    # Category tree
    # ------------------------------------------------------------------

    @classmethod
    def get_categories(cls) -> List[MorphCategory]:
        """Build the category tree from loaded modifiers."""
        tree: Dict[str, MorphCategory] = {}
        for mod in _modifiers.values():
            group = mod.group or "misc"
            top = group.split("/")[0]
            if top not in tree:
                tree[top] = MorphCategory(name=top, label=top.replace("-", " ").title())
            tree[top].modifiers.append(mod)
        return sorted(tree.values(), key=lambda c: c.name)

    @classmethod
    def get_modifiers(
        cls,
        category: Optional[str] = None,
        search: Optional[str] = None,
        modified_only: bool = False,
    ) -> List[MorphModifier]:
        """Return modifiers, optionally filtered."""
        results = []
        for path, mod in _modifiers.items():
            if category and not mod.group.startswith(category):
                continue
            if search and search.lower() not in mod.name.lower():
                continue
            current = _modifier_values.get(path, mod.default)
            if modified_only and abs(current - mod.default) < 1e-4:
                continue
            # Return a copy with the current value
            results.append(mod.model_copy(update={"value": current}))
        return results

    @classmethod
    def get_modifier(cls, target_path: str) -> Optional[MorphModifier]:
        mod = _modifiers.get(target_path)
        if mod is None:
            return None
        current = _modifier_values.get(target_path, mod.default)
        return mod.model_copy(update={"value": current})

    # ------------------------------------------------------------------
    # Value management
    # ------------------------------------------------------------------

    @classmethod
    def set_value(cls, target_path: str, value: float) -> bool:
        """Set a single modifier value.  Returns False if path unknown."""
        if target_path not in _modifiers:
            return False
        _modifier_values[target_path] = max(0.0, min(1.0, value))
        return True

    @classmethod
    def set_batch(cls, values: List[MorphValue]) -> Dict[str, bool]:
        """Apply a batch of modifier values.  Returns {target_path: success}."""
        return {v.target_path: cls.set_value(v.target_path, v.value) for v in values}

    @classmethod
    def reset(cls, category: Optional[str] = None) -> int:
        """Reset modifiers to their defaults.  Returns count reset."""
        count = 0
        for path, mod in _modifiers.items():
            if category and not mod.group.startswith(category):
                continue
            _modifier_values[path] = mod.default
            count += 1
        return count

    @classmethod
    def get_all_values(cls) -> Dict[str, float]:
        """Return all current modifier values."""
        return dict(_modifier_values)

    @classmethod
    def get_modified_values(cls) -> Dict[str, float]:
        """Return only values that differ from their defaults."""
        result = {}
        for path, value in _modifier_values.items():
            mod = _modifiers.get(path)
            default = mod.default if mod else 0.5
            if abs(value - default) > 1e-6:
                result[path] = value
        return result

    # ------------------------------------------------------------------
    # Target loading (lazy)
    # ------------------------------------------------------------------

    @classmethod
    def load_target_file(cls, target_path: str) -> Optional[Dict[int, List[float]]]:
        """
        Load and cache a .target file.  Returns {vertex_index: [dx,dy,dz]}.
        Tries both compiled binary (.mhbin) and ASCII text formats.
        """
        if target_path in _target_cache:
            return _target_cache[target_path]

        target_dir = get_target_dir()

        for candidate in [
            target_dir / target_path,
            target_dir / (target_path + ".target"),
        ]:
            if candidate.exists():
                data = cls._parse_target_ascii(candidate)
                _target_cache[target_path] = data
                return data
        logger.debug("Target file not found: %s", target_path)
        return None

    @staticmethod
    def _parse_target_ascii(path: Path) -> Dict[int, List[float]]:
        """Parse ASCII .target file into vertex displacement dict."""
        result: Dict[int, List[float]] = {}
        with path.open("r", encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                parts = line.split()
                if len(parts) >= 4:
                    try:
                        idx = int(parts[0])
                        dx, dy, dz = float(parts[1]), float(parts[2]), float(parts[3])
                        result[idx] = [dx, dy, dz]
                    except ValueError:
                        pass
        return result

    # ------------------------------------------------------------------
    # Apply targets to mesh coords
    # ------------------------------------------------------------------

    @classmethod
    def apply_all_to_mesh(
        cls,
        coords: np.ndarray,    # (N, 3) float32
        values: Optional[Dict[str, float]] = None,
    ) -> np.ndarray:
        """
        Apply all (or provided) modifier values to a mesh coordinate array.
        Returns a new (N, 3) array.
        """
        if values is None:
            values = _modifier_values

        result = coords.copy()
        for target_path, value in values.items():
            mod = _modifiers.get(target_path)
            if mod is None:
                continue
            neutral = 0.5
            if value > neutral:
                amount = (value - neutral) * 2.0
                file_name = mod.incr_target
            else:
                amount = (neutral - value) * 2.0
                file_name = mod.decr_target

            if not file_name or abs(amount) < 1e-6:
                continue

            displacements = cls.load_target_file(
                str(Path(mod.group) / file_name)
            )
            if displacements is None:
                continue

            for idx, disp in displacements.items():
                if 0 <= idx < len(result):
                    result[idx] += np.array(disp, dtype=np.float32) * amount

        return result
