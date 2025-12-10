from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ActionCreate(BaseModel):
    type: str
    payload: Optional[str] = None
    script_id: Optional[int] = None


class ActionRead(BaseModel):
    id: int
    device_id: int
    type: str
    status: str
    payload: Optional[str] = None
    logs: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
