from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, validator

from app.core.constants import ALLOWED_INSTALLER_TYPES, ALLOWED_OS_TYPES, ALLOWED_SOURCE_TYPES


class SoftwareBase(BaseModel):
    name: str
    slug: Optional[str] = None
    version: Optional[str] = None
    installer_type: str
    source_type: str
    source: Optional[str] = None
    install_args: Optional[str] = None
    uninstall_args: Optional[str] = None
    target_os_type: Optional[str] = None

    @validator("installer_type")
    def validate_installer_type(cls, v: str) -> str:
        if v not in ALLOWED_INSTALLER_TYPES:
            raise ValueError("Invalid installer_type")
        return v

    @validator("source_type")
    def validate_source_type(cls, v: str) -> str:
        if v not in ALLOWED_SOURCE_TYPES:
            raise ValueError("Invalid source_type")
        return v

    @validator("target_os_type")
    def validate_target_os(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if v not in ALLOWED_OS_TYPES:
            raise ValueError("Invalid target_os_type")
        return v


class SoftwareCreate(SoftwareBase):
    pass


class SoftwareUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    version: Optional[str] = None
    installer_type: Optional[str] = None
    source_type: Optional[str] = None
    source: Optional[str] = None
    install_args: Optional[str] = None
    uninstall_args: Optional[str] = None
    target_os_type: Optional[str] = None

    @validator("installer_type")
    def validate_installer_type(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if v not in ALLOWED_INSTALLER_TYPES:
            raise ValueError("Invalid installer_type")
        return v

    @validator("source_type")
    def validate_source_type(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if v not in ALLOWED_SOURCE_TYPES:
            raise ValueError("Invalid source_type")
        return v

    @validator("target_os_type")
    def validate_target_os(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if v not in ALLOWED_OS_TYPES:
            raise ValueError("Invalid target_os_type")
        return v


class SoftwareRead(SoftwareBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

