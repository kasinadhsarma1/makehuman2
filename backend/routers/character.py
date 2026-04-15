"""
Character router — CRUD for the active MakeHuman2 character.

Endpoints:
  GET    /character               → current character state
  GET    /character/list          → saved character summaries
  POST   /character/new           → create fresh character
  POST   /character/load          → load from .mhm file
  POST   /character/save          → save to .mhm file
  POST   /character/randomize     → randomise current character
  DELETE /character               → reset to blank
"""
from __future__ import annotations

from typing import List

from fastapi import APIRouter, HTTPException, status

from ..models.character import (
    CharacterCreateRequest,
    CharacterLoadRequest,
    CharacterModel,
    CharacterSaveRequest,
    CharacterSummary,
    RandomizeRequest,
)
from ..services.character_service import CharacterService

router = APIRouter(prefix="/character", tags=["character"])


@router.get("", response_model=CharacterModel, summary="Get current character state")
def get_character() -> CharacterModel:
    return CharacterService.get_character()


@router.get(
    "/list",
    response_model=List[CharacterSummary],
    summary="List saved character files",
)
def list_characters() -> List[CharacterSummary]:
    return CharacterService.get_summaries()


@router.post(
    "/new",
    response_model=CharacterModel,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new character",
)
def new_character(request: CharacterCreateRequest) -> CharacterModel:
    return CharacterService.new_character(request)


@router.post("/load", response_model=CharacterModel, summary="Load character from .mhm file")
def load_character(request: CharacterLoadRequest) -> CharacterModel:
    try:
        return CharacterService.load_character(request.file_path)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.post("/save", response_model=dict, summary="Save character to .mhm file")
def save_character(request: CharacterSaveRequest) -> dict:
    try:
        path = CharacterService.save_character(request)
        return {"saved": True, "file_path": path}
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))


@router.post("/randomize", response_model=CharacterModel, summary="Randomise the character")
def randomize_character(request: RandomizeRequest = RandomizeRequest()) -> CharacterModel:
    return CharacterService.randomize(request)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT, summary="Reset character to defaults")
def reset_character() -> None:
    CharacterService.new_character(CharacterCreateRequest())
