from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.script import Script
from app.schemas.script import ScriptCreate, ScriptRead

router = APIRouter(prefix="/scripts", tags=["scripts"])


@router.get("", response_model=List[ScriptRead])
def list_scripts(db: Session = Depends(get_db)):
    scripts = db.query(Script).order_by(Script.name.asc()).all()
    return scripts


@router.get("/{script_id}", response_model=ScriptRead)
def get_script(script_id: int, db: Session = Depends(get_db)):
    script = db.query(Script).filter(Script.id == script_id).first()
    if script is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Script not found"
        )
    return script


@router.post("", response_model=ScriptRead, status_code=status.HTTP_201_CREATED)
def create_script(body: ScriptCreate, db: Session = Depends(get_db)):
    existing = db.query(Script).filter(Script.name == body.name).first()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Script with this name already exists",
        )

    script = Script(
        name=body.name,
        description=body.description,
        language=body.language,
        target_os_type=body.target_os_type,
        content=body.content,
    )
    db.add(script)
    db.commit()
    db.refresh(script)
    return script
