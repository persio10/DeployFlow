from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SoftwareItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    install_command: str
    tags: Optional[str] = None


class SoftwareItemCreate(SoftwareItemBase):
    pass


class SoftwareItemRead(SoftwareItemBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
