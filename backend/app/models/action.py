from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db import Base

ACTION_STATUS_PENDING = "pending"
ACTION_STATUS_RUNNING = "running"
ACTION_STATUS_SUCCEEDED = "succeeded"
ACTION_STATUS_FAILED = "failed"


class Action(Base):
    __tablename__ = "actions"

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("devices.id"), nullable=False)
    type = Column(String, nullable=False)
    payload = Column(Text, nullable=True)
    status = Column(String, nullable=False, default=ACTION_STATUS_PENDING)
    logs = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
    completed_at = Column(DateTime(timezone=True), nullable=True)

    device = relationship("Device", back_populates="actions")
