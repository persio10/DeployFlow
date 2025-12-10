from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = Field("sqlite:///./deployflow.db", env="DATABASE_URL")
    secret_key: str = Field("changeme", env="SECRET_KEY")
    default_enrollment_token: str = Field("changeme", env="DEFAULT_ENROLLMENT_TOKEN")

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)


@lru_cache()
def get_settings() -> Settings:
    return Settings()
