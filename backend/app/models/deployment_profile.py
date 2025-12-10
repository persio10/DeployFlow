from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db import Base


class DeploymentProfile(Base):
    __tablename__ = "deployment_profiles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    target_os_type = Column(String(50), nullable=True, index=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    tasks = relationship(
        "ProfileTask", back_populates="profile", cascade="all, delete-orphan"
    )
    devices = relationship("Device", back_populates="profile")


class ProfileTask(Base):
    __tablename__ = "profile_tasks"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(
        Integer, ForeignKey("deployment_profiles.id", ondelete="CASCADE"), nullable=False
    )

    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    order_index = Column(Integer, nullable=False, default=0)
    action_type = Column(String(100), nullable=False, default="powershell_inline")
    script_id = Column(Integer, ForeignKey("scripts.id"), nullable=True)
    continue_on_error = Column(Boolean, nullable=False, default=True)

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    profile = relationship("DeploymentProfile", back_populates="tasks")
