from datetime import datetime
from typing import Optional

from pydantic import BaseModel


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

    class Config:
        orm_mode = True
