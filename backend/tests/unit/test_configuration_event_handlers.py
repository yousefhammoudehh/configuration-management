"""Tests for configuration event handlers."""

from datetime import datetime
from unittest.mock import AsyncMock, patch

import pytest

from src.application.event_handlers import audit_handler, domain_events_handler
from src.domain.constants.event_topics import EventTopics
from src.domain.entities.configuration import Configuration
from src.domain.events.configuration_events import (
    ConfigurationCreated,
    ConfigurationDeleted,
    ConfigurationUpdated,
)


@pytest.mark.unit
class TestConfigurationEventHandlers:
    """Test configuration event handlers."""

    def _make_configuration(self) -> Configuration:
        """Build a configuration entity for tests."""
        return Configuration(
            key="CONFIG_EVENT",
            label="Config Event",
            data_type="string",
        )

    def _make_event(self, event_cls, config: Configuration):
        """Build a configuration event instance."""
        base = {
            "config_id": config.id,
            "key": config.key,
            "label": config.label,
            "data_type": config.data_type,
            "correlation_id": "corr-123",
            "configuration_entity": config,
        }
        if event_cls is ConfigurationCreated:
            return ConfigurationCreated(created_at=datetime.utcnow(), **base)
        if event_cls is ConfigurationUpdated:
            return ConfigurationUpdated(
                updated_at=datetime.utcnow(),
                changes={"label": "Updated"},
                **base,
            )
        return ConfigurationDeleted(deleted_at=datetime.utcnow(), **base)

    @patch("src.application.event_handlers.audit_handler.log_audit_event")
    async def test_audit_handler_created(self, mock_log):
        """Audit handler logs creation events."""
        config = self._make_configuration()
        event = self._make_event(ConfigurationCreated, config)

        await audit_handler.handle_configuration_created_for_audit(event)

        mock_log.assert_called_once()

    @patch("src.application.event_handlers.audit_handler.log_audit_event")
    async def test_audit_handler_updated(self, mock_log):
        """Audit handler logs update events."""
        config = self._make_configuration()
        event = self._make_event(ConfigurationUpdated, config)

        await audit_handler.handle_configuration_updated_for_audit(event)

        mock_log.assert_called_once()

    @patch("src.application.event_handlers.audit_handler.log_audit_event")
    async def test_audit_handler_deleted(self, mock_log):
        """Audit handler logs delete events."""
        config = self._make_configuration()
        event = self._make_event(ConfigurationDeleted, config)

        await audit_handler.handle_configuration_deleted_for_audit(event)

        mock_log.assert_called_once()

    @patch("src.application.event_handlers.domain_events_handler._get_domain_events_connector")
    async def test_kafka_handler_created(self, mock_get_connector):
        """Kafka handler publishes configuration created events."""
        emit_mock = AsyncMock()

        class DummyMeta:
            def __init__(self, **_kwargs):
                pass

        class DummyConnector:
            emit = emit_mock

        mock_get_connector.return_value = (DummyMeta, DummyConnector)

        config = self._make_configuration()
        event = self._make_event(ConfigurationCreated, config)

        await domain_events_handler.handle_configuration_created_for_kafka(event)

        emit_mock.assert_awaited_once()
        _, kwargs = emit_mock.await_args
        assert kwargs["topic"] == EventTopics.CONFIGURATION_CREATED

    @patch("src.application.event_handlers.domain_events_handler._get_domain_events_connector")
    async def test_kafka_handler_updated(self, mock_get_connector):
        """Kafka handler publishes configuration updated events."""
        emit_mock = AsyncMock()

        class DummyMeta:
            def __init__(self, **_kwargs):
                pass

        class DummyConnector:
            emit = emit_mock

        mock_get_connector.return_value = (DummyMeta, DummyConnector)

        config = self._make_configuration()
        event = self._make_event(ConfigurationUpdated, config)

        await domain_events_handler.handle_configuration_updated_for_kafka(event)

        emit_mock.assert_awaited_once()
        _, kwargs = emit_mock.await_args
        assert kwargs["topic"] == EventTopics.CONFIGURATION_UPDATED

    @patch("src.application.event_handlers.domain_events_handler._get_domain_events_connector")
    async def test_kafka_handler_deleted(self, mock_get_connector):
        """Kafka handler publishes configuration deleted events."""
        emit_mock = AsyncMock()

        class DummyMeta:
            def __init__(self, **_kwargs):
                pass

        class DummyConnector:
            emit = emit_mock

        mock_get_connector.return_value = (DummyMeta, DummyConnector)

        config = self._make_configuration()
        event = self._make_event(ConfigurationDeleted, config)

        await domain_events_handler.handle_configuration_deleted_for_kafka(event)

        emit_mock.assert_awaited_once()
        _, kwargs = emit_mock.await_args
        assert kwargs["topic"] == EventTopics.CONFIGURATION_DELETED
