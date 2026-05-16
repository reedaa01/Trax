from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path

# .env lives at the project root (one level above backend/)
_ENV_FILE = Path(__file__).resolve().parents[3] / ".env"


class Settings(BaseSettings):
    # App
    APP_NAME: str = "TraX API"
    DEBUG: bool = False
    API_VERSION: str = "v1"

    # Database
    DATABASE_URL: str = "mysql+pymysql://reda:Reda2001%40@localhost:3306/trax"

    # JWT
    SECRET_KEY: str = "change-me-in-production-use-256bit-random-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # CORS
    FRONTEND_URL: str = "http://localhost:3000"

    class Config:
        env_file = str(_ENV_FILE)
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
