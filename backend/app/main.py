from fastapi import FastAPI
from sqlalchemy.orm import Session

from app.api.v1.routes import router as api_router
from app.core.config import get_settings
from app.db import SessionLocal, engine
from app.models import Base  # noqa: F401
from app.models.enrollment_token import EnrollmentToken

Base.metadata.create_all(bind=engine)

app = FastAPI(title="DeployFlow Fleet API")


@app.on_event("startup")
def seed_default_enrollment_token() -> None:
    settings = get_settings()
    db: Session = SessionLocal()
    try:
        existing = (
            db.query(EnrollmentToken)
            .filter(EnrollmentToken.token_value == settings.default_enrollment_token)
            .first()
        )
        if existing is None:
            token = EnrollmentToken(
                name="Default Dev Token",
                token_value=settings.default_enrollment_token,
                description="Auto-created default enrollment token for development.",
            )
            db.add(token)
            db.commit()
    finally:
        db.close()


app.include_router(api_router, prefix="/api/v1")
