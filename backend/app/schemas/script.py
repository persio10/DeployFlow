from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.core.constants import ALLOWED_OS_TYPES

try:  # Python 3.11 Literal unpack
    from typing import Literal

    TargetOsType = Optional[Literal[*ALLOWED_OS_TYPES]]
except TypeError:  # pragma: no cover - fallback
    TargetOsType = Optional[str]


class ScriptCreate(BaseModel):
    name: str
    description: Optional[str] = None
    language: str = "powershell"
    target_os_type: TargetOsType = None
    content: str


class ScriptRead(BaseModel):
    id: int
    name: str
    description: Optional[str]
    language: str
    target_os_type: TargetOsType
    content: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
