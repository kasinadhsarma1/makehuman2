"""
Character service — the central coordinator for MakeHuman2 backend.

Mirrors core/baseobj.py (MakeHumanModel / baseClass) and
core/randomizer.py.  Maintains the single active character session.
"""
from __future__ import annotations

import logging
import random
from pathlib import Path
from typing import Any, Dict, List, Optional

from ..models.character import (
    CharacterCreateRequest,
    CharacterInfo,
    CharacterModel,
    CharacterSaveRequest,
    CharacterSummary,
    EquipmentState,
    MacroValues,
    MeasurementData,
    RandomizeRequest,
)
from ..utils.file_helpers import FileHelpers, user_models_dir
from ..utils.mhm_parser import MHMParser
from .asset_service import AssetService
from .morph_service import MorphService

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Single active character state
# ---------------------------------------------------------------------------
_character: CharacterInfo = CharacterInfo(name="untitled")
_file_path: Optional[str] = None
_is_dirty: bool = False

# Macro modifier paths (match MHM convention)
_MACRO_PATHS = {
    "gender":           "macrodetails/Gender",
    "age":              "macrodetails/Age",
    "muscle":           "macrodetails/Muscle",
    "weight":           "macrodetails/Weight",
    "height":           "macrodetails/Height",
    "breastSize":       "macrodetails/BreastSize",
    "breastFirmness":   "macrodetails/BreastFirmness",
    "bodyProportions":  "macrodetails/BodyProportions",
}


class CharacterService:
    """Static service managing the active character session."""

    # ------------------------------------------------------------------
    # Getters
    # ------------------------------------------------------------------

    @classmethod
    def get_character(cls) -> CharacterModel:
        global _character, _file_path, _is_dirty
        # Sync morph values back onto character info
        _character = cls._build_character_info()
        return CharacterModel(
            info=_character,
            is_dirty=_is_dirty,
            file_path=_file_path,
        )

    @classmethod
    def get_summaries(cls) -> List[CharacterSummary]:
        """Return a list of saved character .mhm files from the user dir."""
        models_dir = user_models_dir()
        summaries = []
        if models_dir.exists():
            for mhm_file in sorted(models_dir.rglob("*.mhm")):
                try:
                    data = MHMParser.load(mhm_file)
                    summaries.append(CharacterSummary(
                        name=data.get("name", mhm_file.stem),
                        base_mesh=data.get("baseMesh", "hm08"),
                        file_path=str(mhm_file),
                    ))
                except Exception:
                    pass
        return summaries

    # ------------------------------------------------------------------
    # Create / Load / Save
    # ------------------------------------------------------------------

    @classmethod
    def new_character(cls, request: CharacterCreateRequest) -> CharacterModel:
        global _character, _file_path, _is_dirty
        MorphService.reset()
        AssetService.clear_equipment()
        _file_path = None
        _is_dirty = False
        _character = CharacterInfo(
            name=request.name,
            base_mesh=request.base_mesh,
        )
        if request.randomize:
            cls.randomize(RandomizeRequest())
        logger.info("New character created: %s (%s)", request.name, request.base_mesh)
        return cls.get_character()

    @classmethod
    def load_character(cls, file_path: str) -> CharacterModel:
        global _character, _file_path, _is_dirty
        p = Path(file_path)
        if not p.exists():
            raise FileNotFoundError(f"Character file not found: {file_path}")

        data = MHMParser.load(p)
        MorphService.reset()
        AssetService.clear_equipment()

        # Apply modifiers
        for target_path, value in data.get("modifiers", {}).items():
            MorphService.set_value(target_path, float(value))

        # Apply equipment
        equip = data.get("equipment", {})
        skin = equip.get("skinMaterial")
        if skin:
            AssetService.apply_skin(skin)

        _file_path = file_path
        _is_dirty = False
        _character = cls._build_character_info()
        _character = _character.model_copy(update={
            "name": data.get("name", p.stem),
            "base_mesh": data.get("baseMesh", "hm08"),
        })
        logger.info("Loaded character: %s", file_path)
        return cls.get_character()

    @classmethod
    def save_character(cls, request: CharacterSaveRequest) -> str:
        global _file_path, _is_dirty
        save_path = request.file_path or _file_path
        if not save_path:
            models_dir = user_models_dir()
            models_dir.mkdir(parents=True, exist_ok=True)
            name = request.name or _character.name or "untitled"
            save_path = str(models_dir / f"{name}.mhm")

        char = cls._build_character_info()
        if request.name:
            char = char.model_copy(update={"name": request.name})

        data = cls._character_to_mhm_dict(char)
        MHMParser.save(data, save_path)
        _file_path = save_path
        _is_dirty = False
        logger.info("Saved character to: %s", save_path)
        return save_path

    # ------------------------------------------------------------------
    # Morph passthrough (marks dirty)
    # ------------------------------------------------------------------

    @classmethod
    def set_morph_value(cls, target_path: str, value: float) -> bool:
        global _is_dirty
        ok = MorphService.set_value(target_path, value)
        if ok:
            _is_dirty = True
        return ok

    @classmethod
    def set_morph_batch(cls, values: List[Dict[str, Any]]) -> Dict[str, bool]:
        global _is_dirty
        from ..models.morph import MorphValue
        mvs = [MorphValue(target_path=v["target_path"], value=v["value"]) for v in values]
        result = MorphService.set_batch(mvs)
        if any(result.values()):
            _is_dirty = True
        return result

    # ------------------------------------------------------------------
    # Randomisation
    # ------------------------------------------------------------------

    @classmethod
    def randomize(cls, request: RandomizeRequest) -> CharacterModel:
        global _is_dirty
        rng = random.Random(request.seed)

        all_modifiers = MorphService.get_modifiers()
        for mod in all_modifiers:
            # Preserve macros if requested
            if request.preserve_gender and mod.group == "macrodetails" and "gender" in mod.target_path.lower():
                continue
            if request.preserve_age and mod.group == "macrodetails" and "age" in mod.target_path.lower():
                continue

            deviation = request.max_deviation
            new_val = 0.5 + (rng.random() - 0.5) * 2 * deviation
            MorphService.set_value(mod.target_path, max(0.0, min(1.0, new_val)))

        _is_dirty = True
        return cls.get_character()

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @classmethod
    def _build_character_info(cls) -> CharacterInfo:
        """Reconstruct CharacterInfo from current service states."""
        global _character
        morph_values = MorphService.get_all_values()
        equip_state = AssetService.get_equipment()

        macros = MacroValues()
        modifiers: Dict[str, float] = {}
        for path, value in morph_values.items():
            matched = False
            for macro_field, macro_path in _MACRO_PATHS.items():
                if path == macro_path:
                    setattr(macros, macro_field, value)
                    matched = True
                    break
            if not matched and abs(value - 0.5) > 1e-6:
                modifiers[path] = value

        equipment = EquipmentState(
            skin_material=equip_state.get("skinMaterial"),
            clothes=[e["name"] for e in equip_state.get("clothes", [])],
            hair=[e["name"] for e in equip_state.get("hair", [])],
            eyes=equip_state.get("eyes", {}).get("name") if equip_state.get("eyes") else None,
            eyebrows=equip_state.get("eyebrows", {}).get("name") if equip_state.get("eyebrows") else None,
            eyelashes=equip_state.get("eyelashes", {}).get("name") if equip_state.get("eyelashes") else None,
            teeth=equip_state.get("teeth", {}).get("name") if equip_state.get("teeth") else None,
            tongue=equip_state.get("tongue", {}).get("name") if equip_state.get("tongue") else None,
            proxy=equip_state.get("proxy", {}).get("name") if equip_state.get("proxy") else None,
        )

        return CharacterInfo(
            name=_character.name,
            base_mesh=_character.base_mesh,
            macros=macros,
            modifiers=modifiers,
            equipment=equipment,
        )

    @staticmethod
    def _character_to_mhm_dict(char: CharacterInfo) -> Dict[str, Any]:
        """Convert CharacterInfo to the dict format expected by MHMParser."""
        modifiers: Dict[str, float] = {}
        # Write macros
        for macro_field, macro_path in _MACRO_PATHS.items():
            val = getattr(char.macros, macro_field, 0.5)
            modifiers[macro_path] = val
        modifiers.update(char.modifiers)

        equip = char.equipment
        clothes = [{"name": n, "uuid": None, "material": None} for n in equip.clothes]
        hair = [{"name": n, "uuid": None, "material": None} for n in equip.hair]

        def _slot(name: Optional[str]) -> Optional[Dict]:
            return {"name": name, "uuid": None, "material": None} if name else None

        return {
            "version": "v2.0.1",
            "name": char.name,
            "baseMesh": char.base_mesh,
            "modifiers": modifiers,
            "equipment": {
                "skinMaterial": equip.skin_material,
                "clothes": clothes,
                "hair": hair,
                "eyes": _slot(equip.eyes),
                "eyebrows": _slot(equip.eyebrows),
                "eyelashes": _slot(equip.eyelashes),
                "teeth": _slot(equip.teeth),
                "tongue": _slot(equip.tongue),
                "proxy": _slot(equip.proxy),
            },
            "tags": char.tags,
            "description": char.description,
        }
