from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.core.constants import ALLOWED_OS_TYPES, ALLOWED_SCRIPT_LANGUAGES

try:  # Python 3.11 Literal unpack
    from typing import Literal

    TargetOsType = Optional[Literal[*ALLOWED_OS_TYPES]]
    ScriptLanguage = Literal[*ALLOWED_SCRIPT_LANGUAGES]
except TypeError:  # pragma: no cover - fallback
    TargetOsType = Optional[str]
    ScriptLanguage = str


class ScriptBase(BaseModel):
    name: str
    description: Optional[str] = None
    language: ScriptLanguage = "powershell"
    target_os_type: TargetOsType = None
    content: str


class ScriptCreate(ScriptBase):
    pass


class ScriptUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    language: Optional[ScriptLanguage] = None
    target_os_type: TargetOsType = None
    content: Optional[str] = None


class ScriptRead(BaseModel):
    id: int
    name: str
    description: Optional[str]
    language: ScriptLanguage
    target_os_type: TargetOsType
    content: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
