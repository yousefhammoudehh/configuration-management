"""Service layer for Configuration business logic."""

import uuid
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.entities.configuration import Configuration, ParentCondition, Translation, ValidationRule
from src.application.repositories.configuration_repository import ConfigurationRepository
from src.utils.logging import get_logger

logger = get_logger(__name__)


class ConfigurationService:
    """Service for configuration operations."""

    def __init__(self, session: AsyncSession):
        """Initialize service."""
        self.repository = ConfigurationRepository(session)

    async def create_configuration(
        self,
        key: str,
        label: str,
        data_type: str,
        description: str | None = None,
        default_value: str | None = None,
        validation_rules: list[ValidationRule] | None = None,
        parent_config_id: UUID | None = None,
        parent_conditions: list[ParentCondition] | None = None,
        translations: list[Translation] | None = None,
        correlation_id: str | None = None,
    ) -> Configuration:
        """Create a new configuration."""
        logger.info("Creating configuration", key=key)

        # Check if key already exists
        existing = await self.repository.get_by_key(key)
        if existing:
            raise ValueError(f"Configuration with key '{key}' already exists")

        config = Configuration(
            id=uuid.uuid4(),
            key=key,
            label=label,
            description=description,
            data_type=data_type,
            default_value=default_value,
            validation_rules=validation_rules or [],
            parent_config_id=parent_config_id,
            parent_conditions=parent_conditions or [],
            translations=translations or [],
            active=True,
        )

        return await self.repository.create(config, correlation_id=correlation_id)

    async def get_configuration(self, config_id: UUID) -> Configuration | None:
        """Get configuration by ID."""
        logger.info("Getting configuration", config_id=str(config_id))
        return await self.repository.get_by_id(config_id)

    async def list_configurations(self, limit: int = 10, offset: int = 0) -> tuple[list[Configuration], int]:
        """List all configurations with pagination."""
        logger.info("Listing configurations", limit=limit, offset=offset)
        return await self.repository.list_all(limit=limit, offset=offset)

    async def update_configuration(
        self,
        config_id: UUID,
        correlation_id: str | None = None,
        **updates,
    ) -> Configuration | None:
        """Update a configuration."""
        logger.info("Updating configuration", config_id=str(config_id))

        # Don't allow updating key
        updates.pop("key", None)

        return await self.repository.update(config_id, updates, correlation_id=correlation_id)

    async def delete_configuration(self, config_id: UUID, correlation_id: str | None = None) -> bool:
        """Delete a configuration."""
        logger.info("Deleting configuration", config_id=str(config_id))
        return await self.repository.delete(config_id, correlation_id=correlation_id)

    async def get_parent_options(self, current_config_id: UUID | None = None) -> list[Configuration]:
        """Get available parent configurations (excluding current and its descendants)."""
        configs, _ = await self.repository.list_all(limit=1000)

        if not current_config_id:
            return configs

        # Filter out the current configuration and all its descendants
        excluded_ids = {current_config_id}

        # Find all descendants recursively
        def find_descendants(parent_id: UUID):
            """Recursively find all descendants of a given parent."""
            children = [c for c in configs if c.parent_config_id == parent_id]
            for child in children:
                if child.id not in excluded_ids:
                    excluded_ids.add(child.id)
                    find_descendants(child.id)

        find_descendants(current_config_id)

        # Return configs that are not excluded
        available = [c for c in configs if c.id not in excluded_ids]

        return available
