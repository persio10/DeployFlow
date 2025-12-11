from typing import List

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.constants import ALLOWED_OS_TYPES
from app.db import get_db
from app.models.action import ACTION_STATUS_PENDING, Action
from app.models.deployment_profile import DeploymentProfile
from app.models.profile_task import ProfileTask
from app.models.device import Device
from app.models.script import Script
from app.schemas.deployment_profile import (
    DeploymentProfileCreate,
    DeploymentProfileRead,
    DeploymentProfileUpdate,
    DeploymentProfileWithTasks,
    ProfileTaskCreate,
    ProfileTaskRead,
    ProfileTaskUpdate,
    ProfileTaskUpsert,
    ProfileTasksBulkUpdate,
)

router = APIRouter(prefix="/profiles", tags=["profiles"])


def _validate_script_reference(action_type: str, script_id: int, db: Session) -> Script:
    script = db.query(Script).filter(Script.id == script_id).first()
    if script is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Script not found")

    if action_type in ("powershell_script", "powershell_inline") and script.language != "powershell":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Script language mismatch for PowerShell action",
        )

    return script


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

    if body.target_os_type is not None and body.target_os_type not in ALLOWED_OS_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"target_os_type must be one of {', '.join(ALLOWED_OS_TYPES)}",
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


@router.put("/{profile_id}", response_model=DeploymentProfileRead)
def update_profile(
    profile_id: int, body: DeploymentProfileUpdate, db: Session = Depends(get_db)
):
    profile = db.query(DeploymentProfile).filter(DeploymentProfile.id == profile_id).first()
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    update_data = body.model_dump(exclude_unset=True)

    if "target_os_type" in update_data and update_data["target_os_type"] is not None:
        if update_data["target_os_type"] not in ALLOWED_OS_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"target_os_type must be one of {', '.join(ALLOWED_OS_TYPES)}",
            )

    for key, value in update_data.items():
        setattr(profile, key, value)

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
        _validate_script_reference(body.action_type, body.script_id, db)

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


@router.put("/{profile_id}/tasks/{task_id}", response_model=ProfileTaskRead)
def update_profile_task(
    profile_id: int, task_id: int, body: ProfileTaskUpdate, db: Session = Depends(get_db)
):
    profile = db.query(DeploymentProfile).filter(DeploymentProfile.id == profile_id).first()
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    task = (
        db.query(ProfileTask)
        .filter(ProfileTask.id == task_id, ProfileTask.profile_id == profile_id)
        .first()
    )
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    update_data = body.model_dump(exclude_unset=True)

    if "script_id" in update_data and update_data["script_id"] is not None:
        _validate_script_reference(update_data.get("action_type", task.action_type), update_data["script_id"], db)

    for key, value in update_data.items():
        setattr(task, key, value)

    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{profile_id}/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_profile_task(profile_id: int, task_id: int, db: Session = Depends(get_db)):
    profile = db.query(DeploymentProfile).filter(DeploymentProfile.id == profile_id).first()
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    task = (
        db.query(ProfileTask)
        .filter(ProfileTask.id == task_id, ProfileTask.profile_id == profile_id)
        .first()
    )
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    db.delete(task)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put("/{profile_id}/tasks/bulk", response_model=List[ProfileTaskRead])
def replace_profile_tasks(
    profile_id: int, body: ProfileTasksBulkUpdate, db: Session = Depends(get_db)
):
    profile = db.query(DeploymentProfile).filter(DeploymentProfile.id == profile_id).first()
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    db.query(ProfileTask).filter(ProfileTask.profile_id == profile_id).delete()
    created_tasks: list[ProfileTask] = []

    for idx, task in enumerate(body.tasks):
        action_type = task.action_type or "powershell_inline"
        if task.script_id is not None:
            _validate_script_reference(action_type, task.script_id, db)

        created = ProfileTask(
            profile_id=profile_id,
            name=(task.name or f"Task {idx + 1}"),
            description=task.description,
            order_index=task.order_index if task.order_index is not None else idx,
            action_type=action_type,
            script_id=task.script_id,
            continue_on_error=True if task.continue_on_error is None else task.continue_on_error,
        )
        db.add(created)
        created_tasks.append(created)

    db.commit()
    for task in created_tasks:
        db.refresh(task)

    return created_tasks


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
        if device is None or device.is_deleted:
            continue

        if profile.target_os_type and device.os_type and profile.target_os_type != device.os_type:
            continue

        for task in tasks:
            payload: str | None = None
            script_id: int | None = task.script_id

            if task.script_id is not None:
                script = db.query(Script).filter(Script.id == task.script_id).first()
                if script is None:
                    continue

                if task.action_type in ("powershell_script", "powershell_inline") and script.language != "powershell":
                    continue

                if script.target_os_type and device.os_type and script.target_os_type != device.os_type:
                    continue

                payload = script.content

            if task.action_type in {"powershell_inline", "bash_inline"} and payload is None:
                # Skip tasks that require a script payload when none is available
                continue

            action = Action(
                device_id=device.id,
                type=task.action_type,
                payload=payload,
                script_id=script_id,
                status=ACTION_STATUS_PENDING,
            )
            db.add(action)
            created_actions.append(action)

    db.commit()

    return {"created_actions": len(created_actions)}


@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_profile(profile_id: int, db: Session = Depends(get_db)):
    profile = db.query(DeploymentProfile).filter(DeploymentProfile.id == profile_id).first()
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    db.delete(profile)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
