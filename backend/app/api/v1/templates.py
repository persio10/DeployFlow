from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.constants import ALLOWED_OS_TYPES
from app.db import get_db
from app.models.deployment_profile import DeploymentProfile
from app.models.profile_task import ProfileTask
from app.schemas.deployment_profile import (
    DeploymentProfileRead,
    DeploymentProfileUpdate,
    DeploymentProfileWithTasks,
)

router = APIRouter(prefix="/templates", tags=["templates"])


@router.get("", response_model=List[DeploymentProfileRead])
def list_templates(db: Session = Depends(get_db)):
    templates = (
        db.query(DeploymentProfile)
        .filter(DeploymentProfile.is_template.is_(True))
        .order_by(DeploymentProfile.name.asc())
        .all()
    )
    return templates


@router.get("/{template_id}", response_model=DeploymentProfileWithTasks)
def get_template(template_id: int, db: Session = Depends(get_db)):
    template = (
        db.query(DeploymentProfile)
        .filter(
            DeploymentProfile.id == template_id,
            DeploymentProfile.is_template.is_(True),
        )
        .first()
    )
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")
    return template


class InstantiateTemplateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


@router.post("/{template_id}/instantiate", response_model=DeploymentProfileWithTasks, status_code=status.HTTP_201_CREATED)
def instantiate_template(
    template_id: int,
    body: InstantiateTemplateRequest,
    db: Session = Depends(get_db),
):
    template = (
        db.query(DeploymentProfile)
        .filter(
            DeploymentProfile.id == template_id,
            DeploymentProfile.is_template.is_(True),
        )
        .first()
    )
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")

    new_profile = DeploymentProfile(
        name=body.name or f"{template.name} (copy)",
        description=body.description if body.description is not None else template.description,
        target_os_type=template.target_os_type,
        is_template=False,
    )
    db.add(new_profile)
    db.flush()

    template_tasks = (
        db.query(ProfileTask)
        .filter(ProfileTask.profile_id == template.id)
        .order_by(ProfileTask.order_index.asc(), ProfileTask.id.asc())
        .all()
    )

    for task in template_tasks:
        cloned_task = ProfileTask(
            profile_id=new_profile.id,
            name=task.name,
            description=task.description,
            order_index=task.order_index,
            action_type=task.action_type,
            script_id=task.script_id,
            continue_on_error=task.continue_on_error,
        )
        db.add(cloned_task)

    db.commit()
    db.refresh(new_profile)
    db.refresh(template)
    # Reload tasks for response
    tasks = (
        db.query(ProfileTask)
        .filter(ProfileTask.profile_id == new_profile.id)
        .order_by(ProfileTask.order_index.asc(), ProfileTask.id.asc())
        .all()
    )
    new_profile.tasks = tasks

    return new_profile


@router.put("/{template_id}", response_model=DeploymentProfileRead)
def update_template(
    template_id: int, payload: DeploymentProfileUpdate, db: Session = Depends(get_db)
):
    template = (
        db.query(DeploymentProfile)
        .filter(
            DeploymentProfile.id == template_id,
            DeploymentProfile.is_template.is_(True),
        )
        .first()
    )
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")

    update_data = payload.model_dump(exclude_unset=True)
    update_data.pop("is_template", None)

    if "target_os_type" in update_data and update_data["target_os_type"] is not None:
        if update_data["target_os_type"] not in ALLOWED_OS_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"target_os_type must be one of {', '.join(ALLOWED_OS_TYPES)}",
            )

    for key, value in update_data.items():
        setattr(template, key, value)

    template.is_template = True

    db.add(template)
    db.commit()
    db.refresh(template)
    return template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(template_id: int, db: Session = Depends(get_db)):
    template = (
        db.query(DeploymentProfile)
        .filter(
            DeploymentProfile.id == template_id,
            DeploymentProfile.is_template.is_(True),
        )
        .first()
    )
    if template is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template not found")

    db.delete(template)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
