from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class OSImageBase(BaseModel):
    name: str
    version: Optional[str] = None
    storage_ref: str
    description: Optional[str] = None
    checksum: Optional[str] = None


class OSImageCreate(OSImageBase):
    pass


class OSImageRead(OSImageBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
