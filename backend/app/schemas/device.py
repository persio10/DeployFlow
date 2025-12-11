from datetime import datetime
from typing import Optional

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class DeviceBase(BaseModel):
    hostname: str
    profile_id: Optional[int] = None
    status: Optional[str] = None
    os_type: Optional[str] = None
    os_version: Optional[str] = None
    hardware_summary: Optional[str] = None
    last_check_in: Optional[datetime] = None


class DeviceCreate(DeviceBase):
    pass


class DeviceUpdate(BaseModel):
    hostname: Optional[str] = None
    profile_id: Optional[int] = None
    status: Optional[str] = None
    os_type: Optional[str] = None
    os_version: Optional[str] = None
    hardware_summary: Optional[str] = None
    last_check_in: Optional[datetime] = None


class DeviceRead(DeviceBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
