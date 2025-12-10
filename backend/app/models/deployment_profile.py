from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db import Base


class DeploymentProfile(Base):
    __tablename__ = "deployment_profiles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    tags = Column(String, nullable=True)
    os_image_id = Column(Integer, ForeignKey("os_images.id"), nullable=True)
    computer_naming_pattern = Column(String, nullable=True)
    admin_credentials_ref = Column(String, nullable=True)
    agent_auto_install = Column(Boolean, default=True)
    is_template = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    os_image = relationship("OSImage")
    tasks = relationship("ProfileTask", back_populates="profile", cascade="all, delete-orphan")
    devices = relationship("Device", back_populates="profile")
