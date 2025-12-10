from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db import Base


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String, nullable=False, unique=True)
    profile_id = Column(Integer, ForeignKey("deployment_profiles.id"), nullable=True)
    status = Column(String, nullable=False, default="unknown")
    os_type = Column(String(50), nullable=True, index=True)
    os_version = Column(String, nullable=True)
    hardware_summary = Column(Text, nullable=True)
    last_check_in = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    profile = relationship("DeploymentProfile", back_populates="devices")
    actions = relationship("Action", back_populates="device", cascade="all, delete-orphan")
