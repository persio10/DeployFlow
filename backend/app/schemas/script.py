from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ScriptCreate(BaseModel):
    name: str
    description: Optional[str] = None
    language: str = "powershell"
    target_os_type: Optional[str] = None
    content: str


class ScriptRead(BaseModel):
    id: int
    name: str
    description: Optional[str]
    language: str
    target_os_type: Optional[str]
    content: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
