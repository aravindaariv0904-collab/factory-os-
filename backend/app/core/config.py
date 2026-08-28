"""Centralized application configuration with production safety checks."""
from functools import lru_cache
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    environment: Literal["development", "staging", "production", "test"] = "development"
    secret_key: str = Field(default="", alias="SECRET_KEY")
    database_url: str = Field(
        default="sqlite+aiosqlite:///./factoryos.db",
        alias="DATABASE_URL",
    )
    cors_origins: str = Field(
        default=(
            "http://localhost:3000,http://127.0.0.1:3000,"
            "http://localhost:3124,http://127.0.0.1:3124,"
            "http://localhost:3214,http://127.0.0.1:3214"
        ),
        alias="CORS_ORIGINS",
    )
    celery_broker_url: str = Field(
        default="redis://localhost:6379/1",
        alias="CELERY_BROKER_URL",
    )
    celery_result_backend: str = Field(
        default="redis://localhost:6379/2",
        alias="CELERY_RESULT_BACKEND",
    )
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")
    storage_root: str = Field(default="./storage", alias="STORAGE_ROOT")
    models_dir: str = Field(default="./models", alias="MODELS_DIR")
    ai_service_url: str = Field(default="http://localhost:8001", alias="AI_SERVICE_URL")
    access_token_expire_minutes: int = Field(default=10080, alias="ACCESS_TOKEN_EXPIRE_MINUTES")
    refresh_token_expire_days: int = 30
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    allow_dev_auth_bypass: bool = Field(default=False, alias="ALLOW_DEV_AUTH_BYPASS")

    @field_validator("secret_key")
    @classmethod
    def validate_secret_key(cls, value: str, info) -> str:
        env = info.data.get("environment", "development")
        insecure_defaults = {
            "",
            "SUPER_SECRET_KEY_FACTORY_OS_2026",
            "change-me-in-production-use-openssl-rand-hex-32",
        }
        if env in ("production", "staging") and value in insecure_defaults:
            raise ValueError(
                "SECRET_KEY must be set to a secure random value in production/staging"
            )
        if env == "development" and value in insecure_defaults:
            return "dev-only-insecure-key-not-for-production"
        return value

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def is_development(self) -> bool:
        return self.environment == "development"


@lru_cache
def get_settings() -> Settings:
    return Settings()
