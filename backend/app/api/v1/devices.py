from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.action import Action
from app.models.device import Device
from app.models.action import ACTION_STATUS_PENDING
from app.schemas.device import DeviceRead, DeviceUpdate

router = APIRouter(prefix="/devices", tags=["devices"])


@router.get("/", response_model=List[DeviceRead])
def list_devices(db: Session = Depends(get_db)):
    return db.query(Device).filter(Device.is_deleted.is_(False)).all()


@router.get("/{device_id}", response_model=DeviceRead)
def get_device(device_id: int, db: Session = Depends(get_db)):
    device = (
        db.query(Device)
        .filter(Device.id == device_id, Device.is_deleted.is_(False))
        .first()
    )
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device


@router.put("/{device_id}", response_model=DeviceRead)
def update_device(device_id: int, payload: DeviceUpdate, db: Session = Depends(get_db)):
    device = (
        db.query(Device)
        .filter(Device.id == device_id, Device.is_deleted.is_(False))
        .first()
    )
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(device, key, value)
    db.commit()
    db.refresh(device)
    return device


@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_device(device_id: int, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device or device.is_deleted:
        raise HTTPException(status_code=404, detail="Device not found")

    device.is_deleted = True

    uninstall_action = Action(
        device_id=device.id,
        type="agent_uninstall",
        payload='{"reason": "device_deleted"}',
        status=ACTION_STATUS_PENDING,
    )
    db.add(uninstall_action)
    db.commit()

    return Response(status_code=status.HTTP_204_NO_CONTENT)
