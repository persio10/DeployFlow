from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ActionBase(BaseModel):
    device_id: int
    type: str
    payload: Optional[str] = None
    status: Optional[str] = None
    logs: Optional[str] = None
    completed_at: Optional[datetime] = None


class ActionCreate(ActionBase):
    pass


class ActionRead(ActionBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
