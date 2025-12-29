"""Configuration domain events."""

import asyncio
import uuid
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, Optional

from src.domain.entities.configuration import Configuration as ConfigurationEntity


@dataclass
class ConfigurationCreated:
    """Event emitted when a configuration is created."""

    config_id: uuid.UUID
    key: str
    label: str
    data_type: str
    created_at: datetime
    correlation_id: str
    configuration_entity: ConfigurationEntity


@dataclass
class ConfigurationUpdated:
    """Event emitted when a configuration is updated."""

    config_id: uuid.UUID
    key: str
    label: str
    data_type: str
    updated_at: Optional[datetime]
    changes: Dict[str, Any]
    correlation_id: str
    configuration_entity: ConfigurationEntity


@dataclass
class ConfigurationDeleted:
    """Event emitted when a configuration is deleted."""

    config_id: uuid.UUID
    key: str
    label: str
    data_type: str
    deleted_at: Optional[datetime]
    correlation_id: str
    configuration_entity: ConfigurationEntity


class EventEmitter:
    """Simple event emitter for domain events."""

    def __init__(self) -> None:
        self._handlers: dict[str, list] = {}

    def on(self, event_type: str, handler) -> None:
        """Subscribe a handler to an event type."""
        if event_type not in self._handlers:
            self._handlers[event_type] = []
        self._handlers[event_type].append(handler)

    def emit(self, event) -> None:
        """Emit an event to all subscribed handlers."""
        event_type = event.__class__.__name__
        if event_type in self._handlers:
            for handler in self._handlers[event_type]:
                try:
                    if asyncio.iscoroutinefunction(handler):
                        try:
                            loop = asyncio.get_running_loop()
                            loop.create_task(handler(event))
                        except RuntimeError:
                            asyncio.run(handler(event))
                    else:
                        handler(event)
                except Exception as exc:
                    import structlog

                    logger = structlog.get_logger(__name__)
                    logger.error(
                        "Error in event handler",
                        event_type=event_type,
                        handler=handler.__name__,
                        error=str(exc),
                    )


configuration_events = EventEmitter()
