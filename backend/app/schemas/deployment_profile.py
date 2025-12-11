from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict

from app.core.constants import ALLOWED_OS_TYPES

try:  # Python 3.11 Literal unpack
    from typing import Literal

    TargetOsType = Optional[Literal[*ALLOWED_OS_TYPES]]
except TypeError:  # pragma: no cover - fallback
    TargetOsType = Optional[str]


class ProfileTaskBase(BaseModel):
    name: str
    description: Optional[str] = None
    order_index: int = 0
    action_type: str = "powershell_inline"
    script_id: Optional[int] = None
    continue_on_error: bool = True


class ProfileTaskCreate(ProfileTaskBase):
    pass


class ProfileTaskUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    order_index: Optional[int] = None
    action_type: Optional[str] = None
    script_id: Optional[int] = None
    continue_on_error: Optional[bool] = None


class ProfileTaskRead(ProfileTaskBase):
    id: int
    profile_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DeploymentProfileBase(BaseModel):
    name: str
    description: Optional[str] = None
    target_os_type: TargetOsType = None
    is_template: bool = False


class DeploymentProfileCreate(DeploymentProfileBase):
    pass


class DeploymentProfileUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    target_os_type: TargetOsType = None
    is_template: Optional[bool] = None


class DeploymentProfileRead(DeploymentProfileBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DeploymentProfileWithTasks(DeploymentProfileRead):
    tasks: List[ProfileTaskRead] = []


class ProfileTaskUpsert(ProfileTaskBase):
    id: Optional[int] = None


class ProfileTasksBulkUpdate(BaseModel):
    tasks: List[ProfileTaskUpsert]
