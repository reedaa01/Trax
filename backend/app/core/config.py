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
    DATABASE_URL: str = "mysql+pymysql://traxuser:traxpassword@mysql:3306/traxdb"

    def __init__(self, **data):
        super().__init__(**data)
        running_on_railway = bool(os.getenv("RAILWAY_ENVIRONMENT") or os.getenv("RAILWAY_PROJECT_ID"))
        
        # Railway MySQL plugin provides credentials via env vars
        railway_db_url = (
            os.getenv("MYSQL_URL")  
            or os.getenv("MYSQL_PUBLIC_URL")
            or os.getenv("DATABASE_URL_MYSQL")
        )
        
        # Check if DATABASE_URL env var was explicitly set (will be in 'data' dict)
        env_database_url = os.getenv("DATABASE_URL")

        if running_on_railway:
            # Priority: railway-specific vars > explicit DATABASE_URL env > fall back to defaults
            if railway_db_url:
                self.DATABASE_URL = railway_db_url
            elif env_database_url and env_database_url != "mysql+pymysql://root:vkYwgQqsuPwqVkPUPRhchmJCEkxPUmES@yamanote.proxy.rlwy.net:49668/railway":
                # DATABASE_URL was explicitly set to something other than docker-compose default
                self.DATABASE_URL = env_database_url
            else:
                # Still no valid database URL found
                import sys
                print(
                    "\n⚠️  WARNING: Running on Railway but no database URL environment variables found.\n"
                    "   Expected one of: MYSQL_URL, MYSQL_PUBLIC_URL, DATABASE_URL, DATABASE_URL_MYSQL\n"
                    "   If MySQL plugin just linked: wait 1-2 minutes and redeploy.\n"
                    "   Otherwise: Check Railway Variables tab that MySQL is linked.\n",
                    file=sys.stderr
                )
        elif railway_db_url:
            # Local dev with Railway MySQL URL available
            self.DATABASE_URL = railway_db_url

        self.DATABASE_URL = _normalize_database_url(self.DATABASE_URL)

    # JWT
    SECRET_KEY: str = "dev-key-not-for-production"  # MUST SET IN RAILWAY ENVIRONMENT VARIABLES
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # CORS
    FRONTEND_URL: str = ""  # MUST SET IN RAILWAY ENVIRONMENT VARIABLES

@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
