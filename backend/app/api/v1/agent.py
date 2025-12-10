from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.action import (
    ACTION_STATUS_FAILED,
    ACTION_STATUS_PENDING,
    ACTION_STATUS_RUNNING,
    ACTION_STATUS_SUCCEEDED,
    Action,
)
from app.models.device import Device
from app.models.enrollment_token import EnrollmentToken
from app.schemas.agent import (
    AgentActionPayload,
    AgentActionResultRequest,
    AgentHeartbeatRequest,
    AgentHeartbeatResponse,
    AgentRegisterRequest,
    AgentRegisterResponse,
)

router = APIRouter(prefix="/agent", tags=["agent"])


@router.post("/register", response_model=AgentRegisterResponse)
def register_agent(payload: AgentRegisterRequest, db: Session = Depends(get_db)):
    token = (
        db.query(EnrollmentToken)
        .filter(EnrollmentToken.token_value == payload.enrollment_token)
        .first()
    )
    if not token or (token.expires_at and token.expires_at < datetime.utcnow()):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid enrollment token"
        )

    now = datetime.utcnow()
    device = db.query(Device).filter(Device.hostname == payload.hostname).first()
    os_type = payload.os_type or "windows"
    if device:
        device.os_version = payload.os_version
        device.hardware_summary = payload.hardware_summary
        device.last_check_in = now
        device.status = "online"
        device.os_type = payload.os_type or device.os_type or "windows"
    else:
        device = Device(
            hostname=payload.hostname,
            os_version=payload.os_version,
            hardware_summary=payload.hardware_summary,
            os_type=os_type,
            status="online",
            last_check_in=now,
        )
        db.add(device)

    db.commit()
    db.refresh(device)

    return AgentRegisterResponse(device_id=device.id, poll_interval_seconds=30)


@router.get("/heartbeat", summary="Agent heartbeat debug")
async def heartbeat_debug():
    return {"message": "agent heartbeat endpoint is alive"}


@router.post("/heartbeat", response_model=AgentHeartbeatResponse)
def heartbeat(payload: AgentHeartbeatRequest, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.id == payload.device_id).first()
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")

    device.status = payload.status or device.status
    if payload.os_version:
        device.os_version = payload.os_version
    if payload.hardware_summary:
        device.hardware_summary = payload.hardware_summary
    device.last_check_in = datetime.utcnow()

    pending_actions = (
        db.query(Action)
        .filter(Action.device_id == device.id, Action.status == ACTION_STATUS_PENDING)
        .all()
    )

    action_payloads = []
    for action in pending_actions:
        action.status = ACTION_STATUS_RUNNING
        action_payloads.append(
            AgentActionPayload(id=action.id, type=action.type, payload=action.payload)
        )

    db.commit()

    return AgentHeartbeatResponse(actions=action_payloads)


@router.post("/actions/{action_id}/result")
def action_result(action_id: int, payload: AgentActionResultRequest, db: Session = Depends(get_db)):
    action = db.query(Action).filter(Action.id == action_id).first()
    if not action:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Action not found")

    if payload.status not in {ACTION_STATUS_SUCCEEDED, ACTION_STATUS_FAILED}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status")

    action.status = payload.status
    if payload.logs is not None:
        action.logs = payload.logs
    action.completed_at = payload.completed_at or datetime.utcnow()

    if payload.exit_code is not None:
        exit_note = f"exit_code={payload.exit_code}"
        if action.payload:
            action.payload = f"{action.payload}\n{exit_note}"
        else:
            action.payload = exit_note

    db.commit()

    return {"status": "ok"}
