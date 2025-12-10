from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ScriptBase(BaseModel):
    name: str
    description: Optional[str] = None
    body: str
    tags: Optional[str] = None


class ScriptCreate(ScriptBase):
    pass


class ScriptRead(ScriptBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
