from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


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

    model_config = ConfigDict(from_attributes=True)
