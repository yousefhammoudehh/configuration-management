"""Tests for configuration service event emission."""

from unittest.mock import patch

import pytest

from src.application.services.configuration_service import ConfigurationService


@pytest.mark.unit
class TestConfigurationServiceEvents:
    """Test event emission in configuration service flows."""

    async def setup_event_handlers(self) -> None:
        """Set up event handlers for tests."""
        pass

    @patch("src.application.repositories.configuration_repository.configuration_events")
    async def test_create_configuration_emits_event(self, mock_configuration_events, test_db_session):
        """Test configuration creation emits an event."""
        await self.setup_event_handlers()

        service = ConfigurationService(test_db_session)

        config = await service.create_configuration(
            key="TEST_CONFIG",
            label="Test Config",
            data_type="string",
        )

        assert config.key == "TEST_CONFIG"
        assert config.label == "Test Config"

        mock_configuration_events.emit.assert_called_once()
        event = mock_configuration_events.emit.call_args[0][0]
        assert event.__class__.__name__ == "ConfigurationCreated"
        assert event.key == "TEST_CONFIG"

    @patch("src.application.repositories.configuration_repository.configuration_events")
    async def test_update_configuration_emits_event(self, mock_configuration_events, test_db_session):
        """Test configuration update emits an event."""
        await self.setup_event_handlers()

        service = ConfigurationService(test_db_session)

        config = await service.create_configuration(
            key="UPDATE_CONFIG",
            label="Update Config",
            data_type="string",
        )

        updated = await service.update_configuration(
            config_id=config.id,
            label="Updated Label",
        )

        assert updated is not None
        assert updated.label == "Updated Label"

        assert mock_configuration_events.emit.call_count == 2
        event = mock_configuration_events.emit.call_args_list[-1][0][0]
        assert event.__class__.__name__ == "ConfigurationUpdated"
        assert event.changes["label"] == "Updated Label"

    @patch("src.application.repositories.configuration_repository.configuration_events")
    async def test_delete_configuration_emits_event(self, mock_configuration_events, test_db_session):
        """Test configuration deletion emits an event."""
        await self.setup_event_handlers()

        service = ConfigurationService(test_db_session)

        config = await service.create_configuration(
            key="DELETE_CONFIG",
            label="Delete Config",
            data_type="string",
        )

        deleted = await service.delete_configuration(config.id)

        assert deleted is True
        assert mock_configuration_events.emit.call_count == 2
        event = mock_configuration_events.emit.call_args_list[-1][0][0]
        assert event.__class__.__name__ == "ConfigurationDeleted"
