from datetime import datetime
from pydantic import BaseModel


class DeviceBase(BaseModel):
    hostname: str


class DeviceCreate(DeviceBase):
    pass


class DeviceRead(DeviceBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
