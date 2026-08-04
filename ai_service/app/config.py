import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

_REPO_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "FactoryOS AI Service"
    version: str = "1.1.0"
    environment: str = os.getenv("ENVIRONMENT", "development")
    log_level: str = os.getenv("LOG_LEVEL", "INFO")

    models_dir: Path = Path(os.getenv("MODELS_DIR", str(_REPO_ROOT / "models")))
    model_hot_reload: bool = os.getenv("MODEL_HOT_RELOAD", "true").lower() == "true"
    model_reload_interval_seconds: int = int(os.getenv("MODEL_RELOAD_INTERVAL_SECONDS", "30"))

    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    database_url: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@localhost:5432/factory_os",
    )


settings = Settings()
