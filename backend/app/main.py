from fastapi import FastAPI

from app.api.v1.routes import router as api_router
from app.db import engine
from app.models import Base  # noqa: F401

Base.metadata.create_all(bind=engine)

app = FastAPI(title="DeployFlow Fleet API")

app.include_router(api_router, prefix="/api/v1")
