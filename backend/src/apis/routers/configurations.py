"""Configuration API routers."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.apis.models.configuration_models import (
    ConfigurationCreateRequest,
    ConfigurationUpdateRequest,
    ConfigurationResponse,
    ConfigurationListResponse,
    ParentConditionDTO,
    TranslationDTO,
    ValidationRuleDTO,
)
from src.application.services.configuration_service import ConfigurationService
from src.infrastructure.database.connection import get_session
from src.domain.entities.configuration import ParentCondition, Translation, ValidationRule
from src.utils.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(
    prefix="/configurations",
    tags=["configurations"],
)


async def get_configuration_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> ConfigurationService:
    """Dependency to get configuration service."""
    return ConfigurationService(session)


@router.post(
    "/",
    response_model=ConfigurationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_configuration(
    req: ConfigurationCreateRequest,
    service: Annotated[ConfigurationService, Depends(get_configuration_service)],
) -> ConfigurationResponse:
    """Create a new configuration."""
    try:
        validation_rules = [ValidationRule(rule_type=r.rule_type, value=r.value) for r in req.validation_rules]
        parent_conditions = [
            ParentCondition(operator=p.operator, value=p.value, default_value=p.default_value)
            for p in req.parent_conditions
        ]
        translations = [
            Translation(language=t.language, label=t.label, description=t.description) for t in req.translations
        ]

        parent_id = UUID(req.parent_config_id) if req.parent_config_id else None

        config = await service.create_configuration(
            key=req.key,
            label=req.label,
            description=req.description,
            data_type=req.data_type,
            default_value=req.default_value,
            validation_rules=validation_rules,
            parent_config_id=parent_id,
            parent_conditions=parent_conditions,
            translations=translations,
        )

        return _config_to_response(config)

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error("Error creating configuration", error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.get(
    "/",
    response_model=ConfigurationListResponse,
)
async def list_configurations(
    service: Annotated[ConfigurationService, Depends(get_configuration_service)],
    limit: Annotated[int, Query(ge=1, le=100)] = 10,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> ConfigurationListResponse:
    """List all configurations."""
    try:
        configs, total = await service.list_configurations(limit=limit, offset=offset)
        return ConfigurationListResponse(
            items=[_config_to_response(c) for c in configs],
            total=total,
            limit=limit,
            offset=offset,
        )
    except Exception as e:
        logger.error("Error listing configurations", error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.get("/parent-options")
async def get_parent_options_all(
    service: Annotated[ConfigurationService, Depends(get_configuration_service)],
) -> ConfigurationListResponse:
    """Get all available parent configurations (for creating new configs)."""
    try:
        configs = await service.get_parent_options(current_config_id=None)
        return ConfigurationListResponse(
            items=[_config_to_response(c) for c in configs],
            total=len(configs),
            limit=len(configs),
            offset=0,
        )
    except Exception as e:
        logger.error("Error getting parent options", error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.get("/parent-options/by/{config_id}")
async def get_parent_options(
    config_id: UUID,
    service: Annotated[ConfigurationService, Depends(get_configuration_service)],
) -> ConfigurationListResponse:
    """Get available parent configurations (excluding current and descendants)."""
    try:
        configs = await service.get_parent_options(current_config_id=config_id)
        return ConfigurationListResponse(
            items=[_config_to_response(c) for c in configs],
            total=len(configs),
            limit=len(configs),
            offset=0,
        )
    except Exception as e:
        logger.error("Error getting parent options", error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.get(
    "/by-id/{config_id}",
    response_model=ConfigurationResponse,
)
async def get_configuration(
    config_id: UUID,
    service: Annotated[ConfigurationService, Depends(get_configuration_service)],
) -> ConfigurationResponse:
    """Get a configuration by ID."""
    try:
        config = await service.get_configuration(config_id)
        if not config:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Configuration not found")
        return _config_to_response(config)
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error getting configuration", error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.put(
    "/by-id/{config_id}",
    response_model=ConfigurationResponse,
)
async def update_configuration(
    config_id: UUID,
    req: ConfigurationUpdateRequest,
    service: Annotated[ConfigurationService, Depends(get_configuration_service)],
) -> ConfigurationResponse:
    """Update a configuration."""
    try:
        updates = {}

        if req.label is not None:
            updates["label"] = req.label
        if req.description is not None:
            updates["description"] = req.description
        if req.data_type is not None:
            updates["data_type"] = req.data_type
        if req.default_value is not None:
            updates["default_value"] = req.default_value
        if req.validation_rules is not None:
            updates["validation_rules"] = [
                ValidationRule(rule_type=r.rule_type, value=r.value) for r in req.validation_rules
            ]
        if req.parent_config_id is not None:
            updates["parent_config_id"] = UUID(req.parent_config_id)
        if req.parent_conditions is not None:
            updates["parent_conditions"] = [
                ParentCondition(operator=p.operator, value=p.value, default_value=p.default_value)
                for p in req.parent_conditions
            ]
        if req.translations is not None:
            updates["translations"] = [
                Translation(language=t.language, label=t.label, description=t.description) for t in req.translations
            ]
        if req.active is not None:
            updates["active"] = req.active

        config = await service.update_configuration(config_id, **updates)
        if not config:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Configuration not found")
        return _config_to_response(config)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error updating configuration", error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.delete(
    "/by-id/{config_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_configuration(
    config_id: UUID,
    service: Annotated[ConfigurationService, Depends(get_configuration_service)],
) -> None:
    """Delete a configuration."""
    try:
        deleted = await service.delete_configuration(config_id)
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Configuration not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error deleting configuration", error=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


def _config_to_response(config) -> ConfigurationResponse:
    """Convert configuration domain entity to response DTO."""
    return ConfigurationResponse(
        id=str(config.id),
        key=config.key,
        label=config.label,
        description=config.description,
        data_type=config.data_type,
        default_value=config.default_value,
        active=config.active,
        parent_config_id=str(config.parent_config_id) if config.parent_config_id else None,
        validation_rules=[ValidationRuleDTO(rule_type=r.rule_type, value=r.value) for r in config.validation_rules],
        parent_conditions=[
            ParentConditionDTO(operator=c.operator, value=c.value, default_value=c.default_value)
            for c in config.parent_conditions
        ],
        translations=[
            TranslationDTO(language=t.language, label=t.label, description=t.description) for t in config.translations
        ],
        created_at=config.created_at.isoformat(),
        updated_at=config.updated_at.isoformat(),
    )
