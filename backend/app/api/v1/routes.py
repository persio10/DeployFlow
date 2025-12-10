from fastapi import APIRouter

from app.api.v1 import devices, scripts, software

router = APIRouter()

router.include_router(scripts.router)
router.include_router(software.router)
router.include_router(devices.router)


@router.get("/health")
def health_check():
    return {"status": "ok"}
