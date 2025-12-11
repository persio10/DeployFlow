from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.action import ACTION_STATUS_PENDING, Action
from app.models.device import Device
from app.models.script import Script
from app.schemas.action import ActionCreate, ActionRead

router = APIRouter(prefix="/devices", tags=["device-actions"])


@router.post("/{device_id}/actions", response_model=ActionRead, status_code=status.HTTP_201_CREATED)
def create_action_for_device(device_id: int, body: ActionCreate, db: Session = Depends(get_db)):
    device = (
        db.query(Device)
        .filter(Device.id == device_id, Device.is_deleted.is_(False))
        .first()
    )
    if device is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")

    payload = body.payload

    if body.script_id is not None:
        script = db.query(Script).filter(Script.id == body.script_id).first()
        if script is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Script not found"
            )

        if body.type in ("powershell_script", "powershell_inline") and script.language != "powershell":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Script language mismatch for PowerShell action",
            )

        if script.target_os_type and device.os_type and script.target_os_type != device.os_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Script target_os_type is not compatible with device os_type",
            )

        payload = script.content

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either payload or script_id must be provided",
        )

    action = Action(
        device_id=device.id,
        type=body.type,
        payload=payload,
        script_id=body.script_id,
        status=ACTION_STATUS_PENDING,
    )
    db.add(action)
    db.commit()
    db.refresh(action)
    return action


@router.get("/{device_id}/actions", response_model=List[ActionRead])
def list_actions_for_device(device_id: int, db: Session = Depends(get_db)):
    device = (
        db.query(Device)
        .filter(Device.id == device_id, Device.is_deleted.is_(False))
        .first()
    )
    if device is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")

    actions = (
        db.query(Action)
        .filter(Action.device_id == device.id)
        .order_by(Action.created_at.desc())
        .all()
    )
    return actions
