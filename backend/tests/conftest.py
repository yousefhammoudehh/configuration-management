"""Tests conftest."""

import sys
from pathlib import Path

import pytest
from httpx import AsyncClient
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.ext.compiler import compiles

project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.main import app
from src.infrastructure.database.connection import get_session
from src.infrastructure.database.models import Base


@compiles(JSONB, "sqlite")
def compile_jsonb_sqlite(_type, _compiler, **_kwargs) -> str:
    """Render JSONB as JSON for SQLite tests."""
    return "JSON"


@pytest.fixture
async def test_db_session():
    """Create test database session."""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with SessionLocal() as session:
        yield session


@pytest.fixture
async def client(test_db_session):
    """Create test client."""

    async def override_get_session():
        yield test_db_session

    app.dependency_overrides[get_session] = override_get_session
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()
