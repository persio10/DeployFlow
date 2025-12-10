from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.action import ACTION_STATUS_PENDING, Action
from app.models.deployment_profile import DeploymentProfile
from app.models.profile_task import ProfileTask
from app.models.device import Device
from app.models.script import Script
from app.schemas.deployment_profile import (
    DeploymentProfileCreate,
    DeploymentProfileRead,
    DeploymentProfileWithTasks,
    ProfileTaskCreate,
    ProfileTaskRead,
)

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("", response_model=List[DeploymentProfileRead])
def list_profiles(db: Session = Depends(get_db)):
    profiles = db.query(DeploymentProfile).order_by(DeploymentProfile.name.asc()).all()
    return profiles


@router.post("", response_model=DeploymentProfileRead, status_code=status.HTTP_201_CREATED)
def create_profile(body: DeploymentProfileCreate, db: Session = Depends(get_db)):
    existing = db.query(DeploymentProfile).filter(DeploymentProfile.name == body.name).first()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile with this name already exists",
        )

    profile = DeploymentProfile(
        name=body.name,
        description=body.description,
        target_os_type=body.target_os_type,
        is_template=body.is_template,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/{profile_id}", response_model=DeploymentProfileWithTasks)
def get_profile(profile_id: int, db: Session = Depends(get_db)):
    profile = db.query(DeploymentProfile).filter(DeploymentProfile.id == profile_id).first()
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return profile


@router.get("/{profile_id}/tasks", response_model=List[ProfileTaskRead])
def list_profile_tasks(profile_id: int, db: Session = Depends(get_db)):
    profile = db.query(DeploymentProfile).filter(DeploymentProfile.id == profile_id).first()
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    tasks = (
        db.query(ProfileTask)
        .filter(ProfileTask.profile_id == profile_id)
        .order_by(ProfileTask.order_index.asc(), ProfileTask.id.asc())
        .all()
    )
    return tasks


@router.post("/{profile_id}/tasks", response_model=ProfileTaskRead, status_code=status.HTTP_201_CREATED)
def create_profile_task(profile_id: int, body: ProfileTaskCreate, db: Session = Depends(get_db)):
    profile = db.query(DeploymentProfile).filter(DeploymentProfile.id == profile_id).first()
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    if body.script_id is not None:
        script = db.query(Script).filter(Script.id == body.script_id).first()
        if script is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Script not found",
            )

        if body.action_type in ("powershell_script", "powershell_inline") and script.language != "powershell":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Script language mismatch for PowerShell action",
            )

    task = ProfileTask(
        profile_id=profile_id,
        name=body.name,
        description=body.description,
        order_index=body.order_index,
        action_type=body.action_type,
        script_id=body.script_id,
        continue_on_error=body.continue_on_error,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


class ApplyProfileRequest(BaseModel):
    device_ids: List[int]


@router.post("/{profile_id}/apply", status_code=status.HTTP_202_ACCEPTED)
def apply_profile_to_devices(profile_id: int, body: ApplyProfileRequest, db: Session = Depends(get_db)):
    profile = db.query(DeploymentProfile).filter(DeploymentProfile.id == profile_id).first()
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    if not body.device_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No device IDs provided")

    tasks = (
        db.query(ProfileTask)
        .filter(ProfileTask.profile_id == profile_id)
        .order_by(ProfileTask.order_index.asc(), ProfileTask.id.asc())
        .all()
    )

    if not tasks:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Profile has no tasks")

    created_actions: list[Action] = []

    for device_id in body.device_ids:
        device = db.query(Device).filter(Device.id == device_id).first()
        if device is None:
            continue

        if profile.target_os_type and device.os_type and profile.target_os_type != device.os_type:
            continue

        for task in tasks:
            payload: str | None = None

            if task.script_id is not None:
                script = db.query(Script).filter(Script.id == task.script_id).first()
                if script is None:
                    continue

                if task.action_type in ("powershell_script", "powershell_inline") and script.language != "powershell":
                    continue

                if script.target_os_type and device.os_type and script.target_os_type != device.os_type:
                    continue

                payload = script.content

            action = Action(
                device_id=device.id,
                type=task.action_type,
                payload=payload,
                status=ACTION_STATUS_PENDING,
            )
            db.add(action)
            created_actions.append(action)

    db.commit()

    return {"created_actions": len(created_actions)}
