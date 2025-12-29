"""Domain events handler for Kafka publishing."""

from src.domain.constants.event_topics import EventTopics
from src.domain.events.configuration_events import (
    ConfigurationCreated,
    ConfigurationDeleted,
    ConfigurationUpdated,
)
from src.utils.logging import get_logger, log_error_with_context, log_with_context

logger = get_logger(__name__)


def _get_domain_events_connector():
    """Lazy import to avoid hard dependency at import time."""
    from op_utils.domain_events import DomainEventMeta, DomainEventsConnector  # type: ignore

    return DomainEventMeta, DomainEventsConnector


async def handle_configuration_created_for_kafka(event: ConfigurationCreated) -> None:
    """Handle configuration created event for Kafka publishing."""
    try:
        message = {
            "configuration_id": str(event.config_id),
            "key": event.key,
            "label": event.label,
            "data_type": event.data_type,
            "created_at": event.created_at.isoformat(),
        }

        DomainEventMeta, DomainEventsConnector = _get_domain_events_connector()
        meta = DomainEventMeta(
            correlation_id=event.correlation_id,
            event_type=EventTopics.CONFIGURATION_CREATED,
            source="configuration-engine",
            producer="configuration-engine",
        )

        topic = EventTopics.CONFIGURATION_CREATED

        await DomainEventsConnector.emit(
            topic=topic,
            message=message,
            meta=meta,
        )

        log_with_context(
            logger,
            20,
            "ConfigurationCreated event published to Kafka",
            extra_context={"configuration_id": str(event.config_id), "topic": topic},
            correlation_id=event.correlation_id,
        )
    except Exception as exc:
        log_error_with_context(
            logger,
            "Failed to publish ConfigurationCreated event to Kafka",
            exc,
            extra_context={"configuration_id": str(event.config_id)},
            correlation_id=event.correlation_id,
        )


async def handle_configuration_updated_for_kafka(event: ConfigurationUpdated) -> None:
    """Handle configuration updated event for Kafka publishing."""
    try:
        message = {
            "configuration_id": str(event.config_id),
            "key": event.key,
            "label": event.label,
            "data_type": event.data_type,
            "updated_at": event.updated_at.isoformat() if event.updated_at else None,
            "changes": event.changes,
        }

        DomainEventMeta, DomainEventsConnector = _get_domain_events_connector()
        meta = DomainEventMeta(
            correlation_id=event.correlation_id,
            event_type=EventTopics.CONFIGURATION_UPDATED,
            source="configuration-engine",
            producer="configuration-engine",
        )

        topic = EventTopics.CONFIGURATION_UPDATED

        await DomainEventsConnector.emit(
            topic=topic,
            message=message,
            meta=meta,
        )

        log_with_context(
            logger,
            20,
            "ConfigurationUpdated event published to Kafka",
            extra_context={"configuration_id": str(event.config_id), "topic": topic},
            correlation_id=event.correlation_id,
        )
    except Exception as exc:
        log_error_with_context(
            logger,
            "Failed to publish ConfigurationUpdated event to Kafka",
            exc,
            extra_context={"configuration_id": str(event.config_id)},
            correlation_id=event.correlation_id,
        )


async def handle_configuration_deleted_for_kafka(event: ConfigurationDeleted) -> None:
    """Handle configuration deleted event for Kafka publishing."""
    try:
        message = {
            "configuration_id": str(event.config_id),
            "key": event.key,
            "label": event.label,
            "data_type": event.data_type,
            "deleted_at": event.deleted_at.isoformat() if event.deleted_at else None,
        }

        DomainEventMeta, DomainEventsConnector = _get_domain_events_connector()
        meta = DomainEventMeta(
            correlation_id=event.correlation_id,
            event_type=EventTopics.CONFIGURATION_DELETED,
            source="configuration-engine",
            producer="configuration-engine",
        )

        topic = EventTopics.CONFIGURATION_DELETED

        await DomainEventsConnector.emit(
            topic=topic,
            message=message,
            meta=meta,
        )

        log_with_context(
            logger,
            20,
            "ConfigurationDeleted event published to Kafka",
            extra_context={"configuration_id": str(event.config_id), "topic": topic},
            correlation_id=event.correlation_id,
        )
    except Exception as exc:
        log_error_with_context(
            logger,
            "Failed to publish ConfigurationDeleted event to Kafka",
            exc,
            extra_context={"configuration_id": str(event.config_id)},
            correlation_id=event.correlation_id,
        )
