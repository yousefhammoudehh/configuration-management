"""Audit event handler."""

from src.domain.events.configuration_events import (
    ConfigurationCreated,
    ConfigurationDeleted,
    ConfigurationUpdated,
)
from src.utils.logging import get_logger, log_audit_event

logger = get_logger(__name__)


async def handle_configuration_created_for_audit(event: ConfigurationCreated) -> None:
    """Handle configuration created event for audit logging."""
    log_audit_event(
        logger,
        "CREATE",
        "configuration",
        str(event.config_id),
        correlation_id=event.correlation_id,
        extra_context={
            "configuration_key": event.key,
            "configuration_label": event.label,
            "configuration_type": event.data_type,
            "created_at": event.created_at.isoformat(),
        },
    )

    print(
        f"[AUDIT] Configuration Created | "
        f"ID: {event.config_id} | "
        f"Key: {event.key} | "
        f"Type: {event.data_type} | "
        f"Correlation ID: {event.correlation_id}"
    )


async def handle_configuration_updated_for_audit(event: ConfigurationUpdated) -> None:
    """Handle configuration updated event for audit logging."""
    log_audit_event(
        logger,
        "UPDATE",
        "configuration",
        str(event.config_id),
        correlation_id=event.correlation_id,
        extra_context={
            "configuration_key": event.key,
            "configuration_label": event.label,
            "configuration_type": event.data_type,
            "updated_at": event.updated_at.isoformat() if event.updated_at else None,
        },
    )

    print(
        f"[AUDIT] Configuration Updated | "
        f"ID: {event.config_id} | "
        f"Key: {event.key} | "
        f"Type: {event.data_type} | "
        f"Correlation ID: {event.correlation_id}"
    )


async def handle_configuration_deleted_for_audit(event: ConfigurationDeleted) -> None:
    """Handle configuration deleted event for audit logging."""
    log_audit_event(
        logger,
        "DELETE",
        "configuration",
        str(event.config_id),
        correlation_id=event.correlation_id,
        extra_context={
            "configuration_key": event.key,
            "configuration_label": event.label,
            "configuration_type": event.data_type,
        },
    )

    print(
        f"[AUDIT] Configuration Deleted | "
        f"ID: {event.config_id} | "
        f"Key: {event.key} | "
        f"Type: {event.data_type} | "
        f"Correlation ID: {event.correlation_id}"
    )
