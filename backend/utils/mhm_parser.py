"""
Parser for MakeHuman Model (.mhm) files.

MHM is a line-oriented text format:
    version v2.0.1
    name  character_name
    modifier macrodetails/Gender 0.5
    material asset_name uuid material_path.mhmat
    skinMaterial path/to/skin.mhmat
    clothes asset_name uuid
    hair    asset_name uuid
    eyes    asset_name uuid
    ...
"""
from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


class MHMParser:
    """Parse and serialise .mhm files."""

    VERSION = "v2.0.1"

    # Lines whose second token is a value (not an asset uuid/path triplet)
    _SIMPLE_KEYS = {
        "version", "name", "uuid", "description",
        "tags", "skinMaterial", "skeleton",
    }

    # Lines whose format is:  keyword  asset_name  [uuid]
    _EQUIPMENT_KEYS = {
        "clothes", "hair", "eyes", "eyebrows",
        "eyelashes", "teeth", "tongue", "proxy",
    }

    # ------------------------------------------------------------------
    # Parse
    # ------------------------------------------------------------------

    @classmethod
    def load(cls, path: str | Path) -> Dict[str, Any]:
        """
        Parse an .mhm file and return a structured dict:
        {
            "version": "v2.0.1",
            "name": "...",
            "modifiers": {"macrodetails/Gender": 0.5, ...},
            "equipment": {
                "skinMaterial": "...",
                "clothes": [{"name": "...", "uuid": "...", "material": "..."}, ...],
                "hair": [...],
                "eyes": {...},   # single-slot items are a dict, not a list
                ...
            },
            "skeleton": "...",
            "tags": [...],
        }
        """
        p = Path(path)
        if not p.exists():
            raise FileNotFoundError(f".mhm file not found: {p}")

        result: Dict[str, Any] = {
            "version": cls.VERSION,
            "name": p.stem,
            "modifiers": {},
            "equipment": {
                "skinMaterial": None,
                "clothes": [],
                "hair": [],
                "eyes": None,
                "eyebrows": None,
                "eyelashes": None,
                "teeth": None,
                "tongue": None,
                "proxy": None,
            },
            "skeleton": None,
            "tags": [],
            "description": "",
        }

        with p.open("r", encoding="utf-8") as fh:
            for raw_line in fh:
                line = raw_line.strip()
                if not line or line.startswith("#"):
                    continue
                cls._parse_line(line, result)

        return result

    @classmethod
    def _parse_line(cls, line: str, result: Dict[str, Any]) -> None:
        tokens = line.split()
        if not tokens:
            return

        key = tokens[0]

        if key == "version":
            result["version"] = tokens[1] if len(tokens) > 1 else cls.VERSION

        elif key == "name":
            result["name"] = tokens[1] if len(tokens) > 1 else ""

        elif key == "description":
            result["description"] = " ".join(tokens[1:])

        elif key == "tags":
            result["tags"] = tokens[1:]

        elif key == "modifier":
            # modifier  path/to/target  value
            if len(tokens) >= 3:
                target_path = tokens[1]
                try:
                    value = float(tokens[2])
                except ValueError:
                    value = 0.5
                result["modifiers"][target_path] = value

        elif key == "skinMaterial":
            result["equipment"]["skinMaterial"] = tokens[1] if len(tokens) > 1 else None

        elif key == "skeleton":
            result["skeleton"] = tokens[1] if len(tokens) > 1 else None

        elif key in ("clothes", "hair"):
            # clothes  asset_name  [uuid]  [material_path]
            entry = cls._parse_equipment_entry(tokens)
            result["equipment"][key].append(entry)

        elif key in ("eyes", "eyebrows", "eyelashes", "teeth", "tongue", "proxy"):
            entry = cls._parse_equipment_entry(tokens)
            result["equipment"][key] = entry

        elif key == "material":
            # material  asset_name  [uuid]  material_path
            if len(tokens) >= 3:
                entry = cls._parse_equipment_entry(tokens)
                # Try to attach to the matching equipment item
                cls._attach_material(result, entry)

    @staticmethod
    def _parse_equipment_entry(tokens: List[str]) -> Dict[str, Optional[str]]:
        name = tokens[1] if len(tokens) > 1 else ""
        uuid = tokens[2] if len(tokens) > 2 else None
        material = tokens[3] if len(tokens) > 3 else None
        # Simple heuristic: if uuid looks like a path it is a material override
        if uuid and ("/" in uuid or uuid.endswith(".mhmat")):
            material = uuid
            uuid = None
        return {"name": name, "uuid": uuid, "material": material}

    @staticmethod
    def _attach_material(result: Dict[str, Any], entry: Dict[str, Any]) -> None:
        """Find the equipment item matching entry['name'] and set its material."""
        name = entry.get("name", "")
        mat = entry.get("material")
        if not name or not mat:
            return
        for slot_key in ("clothes", "hair"):
            for item in result["equipment"][slot_key]:
                if item["name"] == name:
                    item["material"] = mat
                    return
        for slot_key in ("eyes", "eyebrows", "eyelashes", "teeth", "tongue", "proxy"):
            item = result["equipment"].get(slot_key)
            if item and item.get("name") == name:
                item["material"] = mat
                return

    # ------------------------------------------------------------------
    # Serialise
    # ------------------------------------------------------------------

    @classmethod
    def save(cls, data: Dict[str, Any], path: str | Path) -> None:
        """Serialise a character dict to an .mhm file."""
        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        lines = cls._build_lines(data)
        with p.open("w", encoding="utf-8") as fh:
            fh.write("\n".join(lines) + "\n")

    @classmethod
    def _build_lines(cls, data: Dict[str, Any]) -> List[str]:
        lines: List[str] = [
            f"# MakeHuman Model File",
            f"version {data.get('version', cls.VERSION)}",
            f"name {data.get('name', 'untitled')}",
        ]

        desc = data.get("description", "").strip()
        if desc:
            lines.append(f"description {desc}")

        tags = data.get("tags", [])
        if tags:
            lines.append("tags " + " ".join(tags))

        # Modifiers
        lines.append("")
        lines.append("# Modifiers")
        for target_path, value in sorted(data.get("modifiers", {}).items()):
            lines.append(f"modifier {target_path} {value:.6f}")

        # Equipment
        equip = data.get("equipment", {})
        lines.append("")
        lines.append("# Equipment")

        skin = equip.get("skinMaterial")
        if skin:
            lines.append(f"skinMaterial {skin}")

        skeleton = data.get("skeleton")
        if skeleton:
            lines.append(f"skeleton {skeleton}")

        for key in ("clothes", "hair"):
            for item in equip.get(key, []):
                lines.append(cls._format_equipment_line(key, item))

        for key in ("eyes", "eyebrows", "eyelashes", "teeth", "tongue", "proxy"):
            item = equip.get(key)
            if item:
                lines.append(cls._format_equipment_line(key, item))

        return lines

    @staticmethod
    def _format_equipment_line(key: str, item: Dict[str, Optional[str]]) -> str:
        name = item.get("name", "")
        uuid = item.get("uuid") or ""
        material = item.get("material") or ""
        parts = [key, name]
        if uuid:
            parts.append(uuid)
        if material:
            if not uuid:
                parts.append("")  # placeholder
            parts.append(material)
        return " ".join(parts).strip()
