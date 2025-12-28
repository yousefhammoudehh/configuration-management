"""Repository for Configuration data access."""

import json
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.infrastructure.database.models import Configuration as ConfigurationModel
from src.domain.entities.configuration import (
    Configuration as ConfigurationEntity,
    ParentCondition,
    Translation,
    ValidationRule,
)
from src.utils.logging import get_logger

logger = get_logger(__name__)


class ConfigurationRepository:
    """Repository for Configuration entity."""

    def __init__(self, session: AsyncSession):
        """Initialize repository."""
        self.session = session

    async def create(self, config: ConfigurationEntity) -> ConfigurationEntity:
        """Create a new configuration."""
        model = ConfigurationModel(
            id=config.id,
            key=config.key,
            label=config.label,
            description=config.description,
            data_type=config.data_type,
            default_value=config.default_value,
            validation_rules=json.dumps(
                [{"rule_type": r.rule_type, "value": r.value} for r in config.validation_rules]
            ),
            parent_config_id=config.parent_config_id,
            parent_conditions=json.dumps(
                [
                    {"operator": c.operator, "value": c.value, "default_value": c.default_value}
                    for c in config.parent_conditions
                ]
            ),
            translations=json.dumps(
                [{"language": t.language, "label": t.label, "description": t.description} for t in config.translations]
            ),
            active=config.active,
        )
        self.session.add(model)
        await self.session.commit()
        logger.info("Configuration created", key=config.key)
        return await self._model_to_domain(model)

    async def get_by_id(self, config_id: UUID) -> ConfigurationEntity | None:
        """Get configuration by ID."""
        stmt = select(ConfigurationModel).where(ConfigurationModel.id == config_id)
        result = await self.session.execute(stmt)
        model = result.scalars().first()
        if model:
            return await self._model_to_domain(model)
        return None

    async def get_by_key(self, key: str) -> ConfigurationEntity | None:
        """Get configuration by key."""
        stmt = select(ConfigurationModel).where(ConfigurationModel.key == key)
        result = await self.session.execute(stmt)
        model = result.scalars().first()
        if model:
            return await self._model_to_domain(model)
        return None

    async def list_all(self, limit: int = 10, offset: int = 0) -> tuple[list[ConfigurationEntity], int]:
        """List all configurations."""
        # Get total count
        count_stmt = select(ConfigurationModel)
        count_result = await self.session.execute(count_stmt)
        total = len(count_result.scalars().all())

        # Get paginated results
        stmt = select(ConfigurationModel).limit(limit).offset(offset)
        result = await self.session.execute(stmt)
        models = result.scalars().all()

        configs = [await self._model_to_domain(model) for model in models]
        return configs, total

    async def update(self, config_id: UUID, updates: dict) -> ConfigurationEntity | None:
        """Update a configuration."""
        stmt = select(ConfigurationModel).where(ConfigurationModel.id == config_id)
        result = await self.session.execute(stmt)
        model = result.scalars().first()

        if not model:
            return None

        for key, value in updates.items():
            if key == "validation_rules" and value is not None:
                value = json.dumps([{"rule_type": r.rule_type, "value": r.value} for r in value])
            elif key == "parent_conditions" and value is not None:
                value = json.dumps(
                    [{"operator": c.operator, "value": c.value, "default_value": c.default_value} for c in value]
                )
            elif key == "translations" and value is not None:
                value = json.dumps(
                    [{"language": t.language, "label": t.label, "description": t.description} for t in value]
                )
            setattr(model, key, value)

        await self.session.commit()
        logger.info("Configuration updated", config_id=str(config_id))
        return await self._model_to_domain(model)

    async def delete(self, config_id: UUID) -> bool:
        """Delete a configuration."""
        stmt = select(ConfigurationModel).where(ConfigurationModel.id == config_id)
        result = await self.session.execute(stmt)
        model = result.scalars().first()

        if not model:
            return False

        await self.session.delete(model)
        await self.session.commit()
        logger.info("Configuration deleted", config_id=str(config_id))
        return True

    async def _model_to_domain(self, model: ConfigurationModel) -> ConfigurationEntity:
        """Convert database model to domain entity."""
        validation_rules = []
        if model.validation_rules:
            rules_data = json.loads(model.validation_rules)
            validation_rules = [ValidationRule(**r) for r in rules_data]

        parent_conditions = []
        if model.parent_conditions:
            conditions_data = json.loads(model.parent_conditions)
            parent_conditions = [ParentCondition(**c) for c in conditions_data]

        translations = []
        if model.translations:
            translations_data = json.loads(model.translations)
            translations = [Translation(**t) for t in translations_data]

        return ConfigurationEntity(
            id=model.id,
            key=model.key,
            label=model.label,
            description=model.description,
            data_type=model.data_type,
            default_value=model.default_value,
            validation_rules=validation_rules,
            parent_config_id=model.parent_config_id,
            parent_conditions=parent_conditions,
            translations=translations,
            active=model.active,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )
