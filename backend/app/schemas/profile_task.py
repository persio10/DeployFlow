from typing import Optional

from pydantic import BaseModel


class ProfileTaskBase(BaseModel):
    profile_id: int
    order: int
    type: str
    configuration: Optional[str] = None


class ProfileTaskCreate(ProfileTaskBase):
    pass


class ProfileTaskRead(ProfileTaskBase):
    id: int

    class Config:
        orm_mode = True
