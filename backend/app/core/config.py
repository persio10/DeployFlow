from functools import lru_cache
from pydantic import BaseSettings, Field


class Settings(BaseSettings):
    database_url: str = Field("sqlite:///./deployflow.db", env="DATABASE_URL")
    secret_key: str = Field("changeme", env="SECRET_KEY")

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
