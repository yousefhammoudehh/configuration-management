"""Database connection and session management."""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from src.configs.settings import get_settings


class Base(DeclarativeBase):
    """Base class for all database models."""

    pass


# Global variables for database connection
engine = None
async_session: async_sessionmaker[AsyncSession] | None = None


async def init_db(database_url: str | None = None) -> None:
    """Initialize database connection."""
    global engine, async_session

    settings = get_settings()
    url = database_url or settings.database_url

    engine = create_async_engine(
        url,
        echo=False,
        pool_pre_ping=True,
    )

    async_session = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    # Create tables (kept for current behavior)
    async with engine.begin() as conn:
        # Ensure models are registered on Base.metadata
        from src.infrastructure.database import models as _models  # noqa: F401

        await conn.run_sync(Base.metadata.create_all)


async def initialize_database(database_url: str) -> None:
    """Backward-compatible database initializer."""
    await init_db(database_url)


async def get_session() -> AsyncGenerator[AsyncSession]:
    """Get database session."""
    if async_session is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")

    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()


async def close_db() -> None:
    """Close database connection."""
    global engine
    if engine:
        await engine.dispose()
