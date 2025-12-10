from datetime import datetime

from sqlalchemy import Column, DateTime, Integer, String, Text
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
