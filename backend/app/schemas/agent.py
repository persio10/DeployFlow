from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class AgentRegisterRequest(BaseModel):
    enrollment_token: str
    hostname: str
    os_version: Optional[str] = None
    hardware_summary: Optional[str] = None


class AgentRegisterResponse(BaseModel):
    device_id: int
    poll_interval_seconds: int = 30


class AgentHeartbeatRequest(BaseModel):
    device_id: int
    status: str = "online"
    os_version: Optional[str] = None
    hardware_summary: Optional[str] = None


class AgentActionPayload(BaseModel):
    id: int
    type: str
    payload: Optional[str] = None


class AgentHeartbeatResponse(BaseModel):
    actions: List[AgentActionPayload]


class AgentActionResultRequest(BaseModel):
    status: str
    exit_code: Optional[int] = None
    logs: Optional[str] = None
    completed_at: Optional[datetime] = None
