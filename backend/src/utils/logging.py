"""Logging utilities."""

import logging
import sys
from typing import Any, Dict, Optional

import structlog


def setup_logging(log_level: str = "INFO") -> None:
    """Configure structured logging."""
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer(),
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, log_level.upper()),
    )


def get_logger(name: str) -> structlog.BoundLogger:
    """Get a structured logger instance."""
    return structlog.get_logger(name)


def log_info(logger: structlog.BoundLogger, message: str, **kwargs: Any) -> None:
    """Log info level message."""
    logger.info(message, **kwargs)


def log_error(logger: structlog.BoundLogger, message: str, **kwargs: Any) -> None:
    """Log error level message."""
    logger.error(message, **kwargs)


def log_with_context(
    logger: structlog.BoundLogger,
    level: int,
    message: str,
    correlation_id: Optional[str] = None,
    extra_context: Optional[Dict[str, Any]] = None,
    user_id: Optional[str] = None,
    **kwargs: Any,
) -> None:
    """Log message with optional correlation and user context."""
    context: Dict[str, Any] = {}
    if correlation_id:
        context["correlation_id"] = correlation_id
    if user_id:
        context["user_id"] = user_id
    if extra_context:
        context.update(extra_context)

    logger.log(level, message, **context, **kwargs)


def log_error_with_context(
    logger: structlog.BoundLogger,
    message: str,
    error: Exception,
    extra_context: Optional[Dict[str, Any]] = None,
    correlation_id: Optional[str] = None,
    user_id: Optional[str] = None,
) -> None:
    """Log error with optional correlation and user context."""
    context = extra_context or {}
    context.update({"error_type": type(error).__name__, "error_message": str(error)})
    log_with_context(
        logger,
        logging.ERROR,
        f"{message}: {error}",
        extra_context=context,
        correlation_id=correlation_id,
        user_id=user_id,
        exc_info=True,
    )


def log_audit_event(
    logger: structlog.BoundLogger,
    action: str,
    resource: str,
    resource_id: str,
    correlation_id: Optional[str] = None,
    user_id: Optional[str] = None,
    extra_context: Optional[Dict[str, Any]] = None,
) -> None:
    """Log audit event with context."""
    context = extra_context or {}
    context.update(
        {
            "audit_action": action,
            "audit_resource": resource,
            "audit_resource_id": resource_id,
        }
    )
    log_with_context(
        logger,
        logging.INFO,
        f"Audit: {action} on {resource} (ID: {resource_id})",
        extra_context=context,
        correlation_id=correlation_id,
        user_id=user_id,
    )
