from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.script import Script
from app.schemas.script import ScriptCreate, ScriptRead

router = APIRouter(prefix="/scripts", tags=["scripts"])


@router.get("/", response_model=List[ScriptRead])
def list_scripts(db: Session = Depends(get_db)):
    return db.query(Script).all()


@router.post("/", response_model=ScriptRead, status_code=status.HTTP_201_CREATED)
def create_script(payload: ScriptCreate, db: Session = Depends(get_db)):
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
def update_script(script_id: int, payload: ScriptCreate, db: Session = Depends(get_db)):
    script = db.query(Script).filter(Script.id == script_id).first()
    if not script:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Script not found")
    for key, value in payload.dict().items():
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
