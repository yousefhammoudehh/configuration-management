"""Domain entities for configurations."""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ValidationRule(BaseModel):
    """Validation rule for a configuration."""

    rule_type: str = Field(..., description="Rule type (min, max, regex, required)")
    value: Any = Field(..., description="Rule value")


class ParentCondition(BaseModel):
    """Parent condition rule."""

    default_value: Any = Field(..., description="Default value for current config when condition matches")
    operator: str = Field(..., description="Operator (=, !=, >, >=, <, <=, between)")
    value: Any = Field(..., description="Parent condition value")


class Translation(BaseModel):
    """Translation for a configuration."""

    description: str | None = Field(None, description="Localized description")
    label: str = Field(..., description="Localized label")
    language: str = Field(..., description="Language code")


class Configuration(BaseModel):
    """Configuration domain entity."""

    active: bool = Field(default=True, description="Active status")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    data_type: str = Field(..., description="string, number, date, or list")
    default_value: str | None = Field(None, description="Default value")
    description: str | None = Field(None, description="Configuration description")
    id: uuid.UUID = Field(default_factory=uuid.uuid4, description="Configuration ID")
    key: str = Field(..., description="Unique configuration key")
    label: str = Field(..., description="Human readable label")
    parent_config_id: uuid.UUID | None = Field(None, description="Parent configuration ID")
    parent_conditions: list[ParentCondition] = Field(default_factory=list)
    translations: list[Translation] = Field(default_factory=list)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    validation_rules: list[ValidationRule] = Field(default_factory=list)

    class Config:
        """Pydantic configuration."""

        from_attributes = True

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "active": self.active,
            "created_at": self.created_at.isoformat(),
            "data_type": self.data_type,
            "default_value": self.default_value,
            "description": self.description,
            "id": str(self.id),
            "key": self.key,
            "label": self.label,
            "parent_config_id": str(self.parent_config_id) if self.parent_config_id else None,
            "updated_at": self.updated_at.isoformat(),
        }
