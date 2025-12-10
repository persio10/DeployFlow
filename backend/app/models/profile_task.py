from sqlalchemy import Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db import Base


class ProfileTask(Base):
    __tablename__ = "profile_tasks"

    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("deployment_profiles.id"), nullable=False)
    order = Column(Integer, nullable=False)
    type = Column(String, nullable=False)
    configuration = Column(Text, nullable=True)

    profile = relationship("DeploymentProfile", back_populates="tasks")
