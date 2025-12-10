from fastapi import FastAPI

from app.api.v1.routes import router as api_router

app = FastAPI(title="DeployFlow Fleet API")

app.include_router(api_router, prefix="/api/v1")


@app.get("/api/v1/health")
def health_check():
    return {"status": "ok"}
