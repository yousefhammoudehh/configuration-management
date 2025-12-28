"""API models for configurations."""

from typing import Any
from pydantic import BaseModel, Field


class ValidationRuleDTO(BaseModel):
    """Validation rule DTO."""

    rule_type: str = Field(..., description="Rule type (min, max, regex, required)")
    value: Any = Field(..., description="Rule value")


class ParentConditionDTO(BaseModel):
    """Parent condition rule DTO."""

    default_value: Any = Field(..., description="Default value when condition matches")
    operator: str = Field(..., description="Operator (=, !=, >, >=, <, <=, between)")
    value: Any = Field(..., description="Parent condition value")


class TranslationDTO(BaseModel):
    """Translation DTO."""

    description: str | None = Field(None, description="Localized description")
    label: str = Field(..., description="Localized label")
    language: str = Field(..., description="Language code")


class ConfigurationCreateRequest(BaseModel):
    """Configuration creation request."""

    data_type: str = Field(..., description="string, number, date, or list")
    default_value: str | None = Field(None, description="Default value")
    description: str | None = Field(None, description="Configuration description")
    key: str = Field(..., min_length=1, max_length=255, description="Unique configuration key")
    label: str = Field(..., min_length=1, max_length=255, description="Human readable label")
    parent_config_id: str | None = Field(None, description="Parent configuration ID")
    parent_conditions: list[ParentConditionDTO] = Field(default_factory=list)
    translations: list[TranslationDTO] = Field(default_factory=list)
    validation_rules: list[ValidationRuleDTO] = Field(default_factory=list)


class ConfigurationUpdateRequest(BaseModel):
    """Configuration update request."""

    active: bool | None = Field(None, description="Active status")
    data_type: str | None = Field(None, description="string, number, date, or list")
    default_value: str | None = Field(None, description="Default value")
    description: str | None = Field(None, description="Configuration description")
    label: str | None = Field(None, description="Human readable label")
    parent_config_id: str | None = Field(None, description="Parent configuration ID")
    parent_conditions: list[ParentConditionDTO] | None = None
    translations: list[TranslationDTO] | None = None
    validation_rules: list[ValidationRuleDTO] | None = None


class ConfigurationResponse(BaseModel):
    """Configuration response DTO."""

    active: bool = Field(..., description="Active status")
    created_at: str = Field(..., description="Creation timestamp")
    data_type: str = Field(..., description="string, number, date, or list")
    default_value: str | None = Field(None, description="Default value")
    description: str | None = Field(None, description="Configuration description")
    id: str = Field(..., description="Configuration ID")
    key: str = Field(..., description="Unique configuration key")
    label: str = Field(..., description="Human readable label")
    parent_config_id: str | None = Field(None, description="Parent configuration ID")
    parent_conditions: list[ParentConditionDTO] = Field(default_factory=list)
    translations: list[TranslationDTO] = Field(default_factory=list)
    updated_at: str = Field(..., description="Last update timestamp")
    validation_rules: list[ValidationRuleDTO] = Field(default_factory=list)

    class Config:
        """Pydantic config."""

        from_attributes = True


class ConfigurationListResponse(BaseModel):
    """Configuration list response."""

    items: list[ConfigurationResponse] = Field(..., description="List of configurations")
    limit: int = Field(..., description="Items per page")
    offset: int = Field(..., description="Offset from start")
    total: int = Field(..., description="Total number of configurations")


class ErrorResponse(BaseModel):
    """Error response."""

    detail: str = Field(..., description="Error details")
    error_code: str | None = Field(None, description="Error code")
