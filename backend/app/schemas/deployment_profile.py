from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict


class ProfileTaskBase(BaseModel):
    name: str
    description: Optional[str] = None
    order_index: int = 0
    action_type: str = "powershell_inline"
    script_id: Optional[int] = None
    continue_on_error: bool = True


class ProfileTaskCreate(ProfileTaskBase):
    pass


class ProfileTaskRead(ProfileTaskBase):
    id: int
    profile_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DeploymentProfileBase(BaseModel):
    name: str
    description: Optional[str] = None
    target_os_type: Optional[str] = None
    is_template: bool = False


class DeploymentProfileCreate(DeploymentProfileBase):
    pass


class DeploymentProfileRead(DeploymentProfileBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DeploymentProfileWithTasks(DeploymentProfileRead):
    tasks: List[ProfileTaskRead] = []
