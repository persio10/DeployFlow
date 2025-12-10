from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.software_item import SoftwareItem
from app.schemas.software_item import SoftwareItemCreate, SoftwareItemRead

router = APIRouter(prefix="/software", tags=["software"])


@router.get("/", response_model=List[SoftwareItemRead])
def list_software(db: Session = Depends(get_db)):
    return db.query(SoftwareItem).all()


@router.post("/", response_model=SoftwareItemRead, status_code=status.HTTP_201_CREATED)
def create_software(payload: SoftwareItemCreate, db: Session = Depends(get_db)):
    software = SoftwareItem(**payload.dict())
    db.add(software)
    db.commit()
    db.refresh(software)
    return software


@router.get("/{software_id}", response_model=SoftwareItemRead)
def get_software(software_id: int, db: Session = Depends(get_db)):
    software = db.query(SoftwareItem).filter(SoftwareItem.id == software_id).first()
    if not software:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Software not found")
    return software


@router.put("/{software_id}", response_model=SoftwareItemRead)
def update_software(software_id: int, payload: SoftwareItemCreate, db: Session = Depends(get_db)):
    software = db.query(SoftwareItem).filter(SoftwareItem.id == software_id).first()
    if not software:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Software not found")
    for key, value in payload.dict().items():
        setattr(software, key, value)
    db.commit()
    db.refresh(software)
    return software


@router.delete("/{software_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_software(software_id: int, db: Session = Depends(get_db)):
    software = db.query(SoftwareItem).filter(SoftwareItem.id == software_id).first()
    if not software:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Software not found")
    db.delete(software)
    db.commit()
    return None
