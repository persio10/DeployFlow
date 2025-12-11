from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.constants import ALLOWED_OS_TYPES, ALLOWED_SCRIPT_LANGUAGES
from app.db import get_db
from app.models.script import Script
from app.schemas.script import ScriptCreate, ScriptRead, ScriptUpdate

router = APIRouter(prefix="/scripts", tags=["scripts"])


def _validate_target_os(target_os_type: str | None) -> None:
    if target_os_type is not None and target_os_type not in ALLOWED_OS_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"target_os_type must be one of {', '.join(ALLOWED_OS_TYPES)}",
        )


def _validate_language(language: str | None) -> None:
    if language is not None and language not in ALLOWED_SCRIPT_LANGUAGES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"language must be one of {', '.join(ALLOWED_SCRIPT_LANGUAGES)}",
        )


@router.get("/", response_model=List[ScriptRead])
def list_scripts(db: Session = Depends(get_db)):
    return db.query(Script).all()


@router.post("/", response_model=ScriptRead, status_code=status.HTTP_201_CREATED)
def create_script(payload: ScriptCreate, db: Session = Depends(get_db)):
    _validate_target_os(payload.target_os_type)
    _validate_language(payload.language)

    script = Script(**payload.dict())
    db.add(script)
    db.commit()
    db.refresh(script)
    return script


@router.get("/{script_id}", response_model=ScriptRead)
def get_script(script_id: int, db: Session = Depends(get_db)):
    script = db.query(Script).filter(Script.id == script_id).first()
    if not script:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Script not found")
    return script


@router.put("/{script_id}", response_model=ScriptRead)
def update_script(script_id: int, payload: ScriptUpdate, db: Session = Depends(get_db)):
    script = db.query(Script).filter(Script.id == script_id).first()
    if not script:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Script not found")

    payload_data = payload.dict(exclude_unset=True)

    if "target_os_type" in payload_data:
        _validate_target_os(payload_data.get("target_os_type"))
    if "language" in payload_data:
        _validate_language(payload_data.get("language"))

    for key, value in payload_data.items():
        setattr(script, key, value)
    db.commit()
    db.refresh(script)
    return script


@router.delete("/{script_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_script(script_id: int, db: Session = Depends(get_db)):
    script = db.query(Script).filter(Script.id == script_id).first()
    if not script:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Script not found")
    db.delete(script)
    db.commit()
    return None
