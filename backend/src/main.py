"""Configuration Engine Backend - Main Application"""

from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator, Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.configs.settings import get_settings
from src.infrastructure.database.connection import initialize_database
from src.apis.routers import configurations
from src.utils.logging import setup_logging, get_logger

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager."""
    # Startup
    setup_logging(log_level=settings.log_level)
    logger = get_logger(__name__)
    logger.info("Starting Configuration Engine Backend", environment=settings.environment)

    # Initialize database
    await initialize_database(settings.database_url)
    logger.info("Database initialized")

    yield

    # Shutdown
    logger.info("Configuration Engine Backend shutting down")


# Create FastAPI application
app = FastAPI(
    title=settings.api_title,
    description="Configuration Engine Backend Service",
    version=settings.api_version,
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(configurations.router, prefix="/api/v1")


@app.get("/")
async def root() -> Dict[str, Any]:
    """Root endpoint."""
    return {
        "message": "Configuration Engine API",
        "version": settings.api_version,
        "docs": "/docs",
    }


@app.get("/health")
async def health_check() -> Dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "src.main:app",
        host=settings.host,
        port=settings.port,
        reload=True if settings.environment == "development" else False,
    )
