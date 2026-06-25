import os
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database - supports both SQLite (dev) and PostgreSQL (production)
    DATABASE_URL: str = "sqlite+aiosqlite:///./nexthire.db"

    # JWT
    JWT_SECRET: str = "nexthire-super-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Qwen Cloud (Alibaba Cloud DashScope)
    DASHSCOPE_API_KEY: str = "your-dashscope-api-key-here"

    # Server
    BACKEND_PORT: int = 8000
    FRONTEND_URL: str = "http://localhost:3001"

    # Uploads
    UPLOAD_DIR: str = "./uploads"

    # Railway / Production port (Railway sets PORT env var)
    PORT: int | None = None

    model_config = {"env_file": ".env", "extra": "ignore"}

    def get_database_url(self) -> str:
        """Return the database URL, converting postgres:// to postgresql+asyncpg:// for Railway."""
        url = self.DATABASE_URL
        # Railway provides DATABASE_URL as postgres:// or postgresql://
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://") and "+asyncpg" not in url:
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url


@lru_cache()
def get_settings() -> Settings:
    return Settings()
