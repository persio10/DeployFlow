from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class DeploymentProfileBase(BaseModel):
    name: str
    description: Optional[str] = None
    tags: Optional[str] = None
    os_image_id: Optional[int] = None
    computer_naming_pattern: Optional[str] = None
    admin_credentials_ref: Optional[str] = None
    agent_auto_install: bool = True
    is_template: bool = False


class DeploymentProfileCreate(DeploymentProfileBase):
    pass


class DeploymentProfileRead(DeploymentProfileBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
