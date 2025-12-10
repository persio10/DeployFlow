from fastapi import APIRouter

from app.api.v1 import (
    agent,
    deployment_profiles,
    device_actions,
    devices,
    scripts_library,
    software,
)

router = APIRouter()

router.include_router(scripts_library.router)
router.include_router(software.router)
router.include_router(deployment_profiles.router)
router.include_router(devices.router)
router.include_router(device_actions.router)
router.include_router(agent.router)


@router.get("/health")
def health_check():
    return {"status": "ok"}
