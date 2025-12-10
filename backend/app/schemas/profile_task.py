from typing import Optional

from pydantic import BaseModel, ConfigDict


class ProfileTaskBase(BaseModel):
    profile_id: int
    order: int
    type: str
    configuration: Optional[str] = None


class ProfileTaskCreate(ProfileTaskBase):
    pass


class ProfileTaskRead(ProfileTaskBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
