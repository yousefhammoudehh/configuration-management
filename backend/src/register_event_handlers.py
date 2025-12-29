"""Event handler registration system."""

import structlog

from src.domain.events.configuration_events import configuration_events
from src.application.event_handlers.audit_handler import (
    handle_configuration_created_for_audit,
    handle_configuration_deleted_for_audit,
    handle_configuration_updated_for_audit,
)
from src.application.event_handlers.domain_events_handler import (
    handle_configuration_created_for_kafka,
    handle_configuration_deleted_for_kafka,
    handle_configuration_updated_for_kafka,
)

logger = structlog.get_logger(__name__)


def register_all_event_handlers() -> None:
    """Register all event handlers."""
    configuration_events.on("ConfigurationCreated", handle_configuration_created_for_audit)
    configuration_events.on("ConfigurationUpdated", handle_configuration_updated_for_audit)
    configuration_events.on("ConfigurationDeleted", handle_configuration_deleted_for_audit)

    configuration_events.on("ConfigurationCreated", handle_configuration_created_for_kafka)
    configuration_events.on("ConfigurationUpdated", handle_configuration_updated_for_kafka)
    configuration_events.on("ConfigurationDeleted", handle_configuration_deleted_for_kafka)

    logger.info("Event handlers registration completed")
