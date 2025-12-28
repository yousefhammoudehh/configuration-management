"""Application configuration settings."""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_nested_delimiter="__",
        json_loads=lambda x: eval(x),  # Allow parsing of list literals
    )

    # API
    api_title: str = "Configuration Engine"
    api_version: str = "0.1.0"
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/task1_db"
    test_database_url: str = "sqlite+aiosqlite:///:memory:"

    # Logging
    log_level: str = "INFO"

    # CORS
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Environment
    environment: str = "development"


@lru_cache
def get_settings() -> Settings:
    """Get application settings."""
    return Settings()
