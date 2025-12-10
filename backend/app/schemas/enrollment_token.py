from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class EnrollmentTokenBase(BaseModel):
    name: str
    token_value: str
    description: Optional[str] = None
    expires_at: Optional[datetime] = None
    allowed_profiles: Optional[str] = None


class EnrollmentTokenCreate(EnrollmentTokenBase):
    pass


class EnrollmentTokenRead(EnrollmentTokenBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
