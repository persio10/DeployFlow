from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.core.constants import ALLOWED_INSTALLER_TYPES
from app.db import get_db
from app.models.profile_task import ProfileTask
from app.models.software_package import SoftwarePackage
from app.schemas.software import SoftwareCreate, SoftwareRead, SoftwareUpdate

router = APIRouter(prefix="/software", tags=["software"])


def _validate_payload(payload: SoftwareCreate | SoftwareUpdate) -> None:
    # Simple source requirement for non-catalog installers
    if getattr(payload, "installer_type", None) not in {"winget", "choco"}:
        if getattr(payload, "source", None) in {None, ""}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="source is required unless using winget or choco",
            )


@router.get("/", response_model=List[SoftwareRead])
def list_software(
    target_os: Optional[str] = Query(None, description="Filter by target_os_type"),
    db: Session = Depends(get_db),
):
    query = db.query(SoftwarePackage)
    if target_os:
        query = query.filter(SoftwarePackage.target_os_type == target_os)
    return query.order_by(SoftwarePackage.name.asc()).all()


@router.post("/", response_model=SoftwareRead, status_code=status.HTTP_201_CREATED)
def create_software(payload: SoftwareCreate, db: Session = Depends(get_db)):
    _validate_payload(payload)

    software = SoftwarePackage(**payload.model_dump())
    db.add(software)
    db.commit()
    db.refresh(software)
    return software


@router.get("/{software_id}", response_model=SoftwareRead)
def get_software(software_id: int, db: Session = Depends(get_db)):
    software = db.query(SoftwarePackage).filter(SoftwarePackage.id == software_id).first()
    if not software:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Software not found")
    return software


@router.put("/{software_id}", response_model=SoftwareRead)
def update_software(software_id: int, payload: SoftwareUpdate, db: Session = Depends(get_db)):
    software = db.query(SoftwarePackage).filter(SoftwarePackage.id == software_id).first()
    if not software:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Software not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "installer_type" in update_data and update_data["installer_type"] not in ALLOWED_INSTALLER_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid installer_type")

    # Require source unless winget/choco
    if update_data.get("installer_type", software.installer_type) not in {"winget", "choco"}:
        if update_data.get("source") is None and not software.source:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="source is required unless using winget or choco",
            )

    for key, value in update_data.items():
        setattr(software, key, value)

    db.add(software)
    db.commit()
    db.refresh(software)
    return software


@router.delete("/{software_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_software(software_id: int, db: Session = Depends(get_db)):
    software = db.query(SoftwarePackage).filter(SoftwarePackage.id == software_id).first()
    if not software:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Software not found")

    in_use = db.query(ProfileTask).filter(ProfileTask.software_id == software_id).first()
    if in_use:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Software is referenced by one or more tasks and cannot be deleted",
        )

    db.delete(software)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
