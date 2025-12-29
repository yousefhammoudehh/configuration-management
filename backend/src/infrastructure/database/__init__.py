"""Database infrastructure package."""


def import_models() -> None:
    """Import database models to register them with SQLAlchemy."""
    from src.infrastructure.database import models  # noqa: F401
