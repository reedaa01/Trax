import os
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parents[2]
_ROOT_ENV_FILE = _BACKEND_DIR.parent / ".env"
_BACKEND_ENV_FILE = _BACKEND_DIR / ".env"


def _resolve_env_file() -> str | None:
    if os.getenv("RAILWAY_ENVIRONMENT") or os.getenv("RAILWAY_PROJECT_ID"):
        return None
    if _BACKEND_ENV_FILE.exists():
        return str(_BACKEND_ENV_FILE)
    if _ROOT_ENV_FILE.exists():
        return str(_ROOT_ENV_FILE)
    return None


_ENV_FILE = _resolve_env_file()


def _normalize_database_url(url: str) -> str:
    normalized = url.strip()
    if normalized.startswith("mysql://"):
        return normalized.replace("mysql://", "mysql+pymysql://", 1)
    return normalized


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_ENV_FILE,
        extra="ignore",
    )

    # App
    APP_NAME: str = "TraX API"
    DEBUG: bool = False
    API_VERSION: str = "v1"

    # Database
    DATABASE_URL: str = "mysql+pymysql://reda:Reda2001%40@localhost:3306/trax"

    def __init__(self, **data):
        super().__init__(**data)
        railway_mysql_url = os.getenv("MYSQL_URL") or os.getenv("MYSQL_PUBLIC_URL")
        running_on_railway = bool(os.getenv("RAILWAY_ENVIRONMENT") or os.getenv("RAILWAY_PROJECT_ID") or railway_mysql_url)

        if running_on_railway and (not self.DATABASE_URL or "localhost" in self.DATABASE_URL):
            if railway_mysql_url:
                self.DATABASE_URL = railway_mysql_url

        self.DATABASE_URL = _normalize_database_url(self.DATABASE_URL)

    # JWT
    SECRET_KEY: str = "change-me-in-production-use-256bit-random-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # CORS
    FRONTEND_URL: str = "http://localhost:3000"

@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
