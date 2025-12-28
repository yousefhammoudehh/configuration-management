"""Integration tests for Configuration API."""

import pytest
from httpx import AsyncClient
from fastapi import status


@pytest.mark.asyncio
class TestConfigurationsAPI:
    """Test configurations API endpoints."""

    async def test_create_configuration(self, client: AsyncClient):
        """Test creating a configuration."""
        payload = {
            "key": "MAX_RETRIES",
            "label": "Maximum Retries",
            "description": "Maximum number of retries",
            "data_type": "number",
            "default_value": "3",
            "validation_rules": [{"rule_type": "min", "value": 1}, {"rule_type": "max", "value": 10}],
            "translations": [{"language": "en", "label": "Maximum Retries"}],
        }

        response = await client.post("/api/v1/configurations/", json=payload)

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["key"] == "MAX_RETRIES"
        assert data["label"] == "Maximum Retries"
        assert "id" in data

    async def test_get_configuration(self, client: AsyncClient):
        """Test getting a configuration."""
        # Create first
        create_payload = {
            "key": "TEST_CONFIG",
            "label": "Test Config",
            "data_type": "string",
        }
        create_response = await client.post("/api/v1/configurations/", json=create_payload)
        config_id = create_response.json()["id"]

        # Get
        response = await client.get(f"/api/v1/configurations/{config_id}")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == config_id
        assert data["key"] == "TEST_CONFIG"

    async def test_list_configurations(self, client: AsyncClient):
        """Test listing configurations."""
        # Create some configs
        for i in range(3):
            payload = {
                "key": f"CONFIG_{i}",
                "label": f"Config {i}",
                "data_type": "string",
            }
            await client.post("/api/v1/configurations/", json=payload)

        response = await client.get("/api/v1/configurations/?limit=10&offset=0")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["total"] == 3
        assert len(data["items"]) == 3

    async def test_update_configuration(self, client: AsyncClient):
        """Test updating a configuration."""
        # Create
        create_payload = {
            "key": "UPDATE_TEST",
            "label": "Update Test",
            "data_type": "string",
        }
        create_response = await client.post("/api/v1/configurations/", json=create_payload)
        config_id = create_response.json()["id"]

        # Update
        update_payload = {
            "label": "Updated Label",
            "description": "New description",
        }
        response = await client.put(f"/api/v1/configurations/{config_id}", json=update_payload)

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["label"] == "Updated Label"
        assert data["description"] == "New description"

    async def test_delete_configuration(self, client: AsyncClient):
        """Test deleting a configuration."""
        # Create
        create_payload = {
            "key": "DELETE_TEST",
            "label": "Delete Test",
            "data_type": "string",
        }
        create_response = await client.post("/api/v1/configurations/", json=create_payload)
        config_id = create_response.json()["id"]

        # Delete
        response = await client.delete(f"/api/v1/configurations/{config_id}")

        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Verify deleted
        get_response = await client.get(f"/api/v1/configurations/{config_id}")
        assert get_response.status_code == status.HTTP_404_NOT_FOUND

    async def test_health_check(self, client: AsyncClient):
        """Test health check endpoint."""
        response = await client.get("/health")

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["status"] == "healthy"

    async def test_parent_options_excludes_descendants(self, client: AsyncClient):
        """Test that parent options exclude current config and all descendants."""
        # Create config A (root)
        config_a_payload = {
            "key": "CONFIG_A",
            "label": "Config A",
            "data_type": "string",
        }
        response_a = await client.post("/api/v1/configurations/", json=config_a_payload)
        config_a_id = response_a.json()["id"]

        # Create config B with A as parent
        config_b_payload = {
            "key": "CONFIG_B",
            "label": "Config B",
            "data_type": "string",
            "parent_config_id": config_a_id,
        }
        response_b = await client.post("/api/v1/configurations/", json=config_b_payload)
        config_b_id = response_b.json()["id"]

        # Create config D with B as parent (grandchild of A)
        config_d_payload = {
            "key": "CONFIG_D",
            "label": "Config D",
            "data_type": "string",
            "parent_config_id": config_b_id,
        }
        response_d = await client.post("/api/v1/configurations/", json=config_d_payload)
        config_d_id = response_d.json()["id"]

        # Create an unrelated config C
        config_c_payload = {
            "key": "CONFIG_C",
            "label": "Config C",
            "data_type": "string",
        }
        response_c = await client.post("/api/v1/configurations/", json=config_c_payload)
        config_c_id = response_c.json()["id"]

        # Get parent options for config A
        response = await client.get(f"/api/v1/configurations/parent-options/{config_a_id}")

        assert response.status_code == status.HTTP_200_OK
        data = response.json()

        # Extract IDs from the response
        available_ids = [item["id"] for item in data["items"]]

        # Config A should not see itself
        assert config_a_id not in available_ids

        # Config A should not see B (its direct child)
        assert config_b_id not in available_ids

        # Config A should not see D (its grandchild through B)
        assert config_d_id not in available_ids

        # Config A should see C (unrelated config)
        assert config_c_id in available_ids

        # Get parent options for config B
        response_b_options = await client.get(f"/api/v1/configurations/parent-options/{config_b_id}")
        data_b = response_b_options.json()
        available_ids_b = [item["id"] for item in data_b["items"]]

        # Config B should not see itself
        assert config_b_id not in available_ids_b

        # Config B should not see D (its direct child)
        assert config_d_id not in available_ids_b

        # Config B should see A (potential parent)
        assert config_a_id in available_ids_b

        # Config B should see C (unrelated config)
        assert config_c_id in available_ids_b
