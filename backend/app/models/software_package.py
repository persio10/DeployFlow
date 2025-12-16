from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from app.db import Base


class SoftwarePackage(Base):
    __tablename__ = "software_packages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    slug = Column(String(255), nullable=True, unique=True)
    version = Column(String(100), nullable=True)
    installer_type = Column(String(50), nullable=False)
    source_type = Column(String(50), nullable=False)
    source = Column(Text, nullable=True)
    install_args = Column(Text, nullable=True)
    uninstall_args = Column(Text, nullable=True)
    target_os_type = Column(String(50), nullable=True, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
