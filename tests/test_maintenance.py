from datetime import datetime, timedelta, timezone

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_log_maintenance(client: AsyncClient):
    """Test logging maintenance for an item."""
    # Create item
    item_response = await client.post(
        "/api/v1/items",
        json={"name": "Car"},
    )
    item_id = item_response.json()["id"]

    # Log maintenance
    performed_at = datetime.now(timezone.utc).isoformat()
    response = await client.post(
        f"/api/v1/items/{item_id}/maintenance",
        json={"performed_at": performed_at, "notes": "Changed oil"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["notes"] == "Changed oil"
    assert data["item_id"] == item_id


@pytest.mark.asyncio
async def test_get_maintenance_history(client: AsyncClient):
    """Test getting maintenance history for an item."""
    # Create item
    item_response = await client.post(
        "/api/v1/items",
        json={"name": "HVAC"},
    )
    item_id = item_response.json()["id"]

    # Log multiple maintenance entries
    for i in range(3):
        performed_at = (datetime.now(timezone.utc) - timedelta(days=i * 30)).isoformat()
        await client.post(
            f"/api/v1/items/{item_id}/maintenance",
            json={"performed_at": performed_at, "notes": f"Maintenance #{i+1}"},
        )

    # Get history
    response = await client.get(f"/api/v1/items/{item_id}/maintenance")
    assert response.status_code == 200
    logs = response.json()
    assert len(logs) == 3


@pytest.mark.asyncio
async def test_update_maintenance_schedule(client: AsyncClient):
    """Test updating maintenance schedule."""
    # Create item
    item_response = await client.post(
        "/api/v1/items",
        json={"name": "Oil Filter"},
    )
    item_id = item_response.json()["id"]

    # Set schedule
    next_maintenance = (datetime.now(timezone.utc) + timedelta(days=90)).isoformat()
    response = await client.put(
        f"/api/v1/items/{item_id}/schedule",
        json={
            "next_maintenance_at": next_maintenance,
            "maintenance_interval_days": 90,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["maintenance_interval_days"] == 90


@pytest.mark.asyncio
async def test_items_due_for_maintenance(client: AsyncClient):
    """Test listing items due for maintenance."""
    # Create item with past due date
    item_response = await client.post(
        "/api/v1/items",
        json={"name": "Filter"},
    )
    item_id = item_response.json()["id"]

    # Set past due schedule
    past_date = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    await client.put(
        f"/api/v1/items/{item_id}/schedule",
        json={"next_maintenance_at": past_date},
    )

    # Check due items
    response = await client.get("/api/v1/items/due")
    assert response.status_code == 200
    items = response.json()
    assert len(items) == 1
    assert items[0]["id"] == item_id


@pytest.mark.asyncio
async def test_maintenance_updates_last_maintenance_at(client: AsyncClient):
    """Test that logging maintenance updates last_maintenance_at."""
    # Create item
    item_response = await client.post(
        "/api/v1/items",
        json={"name": "Battery"},
    )
    item_id = item_response.json()["id"]

    # Log maintenance
    performed_at = datetime.now(timezone.utc).isoformat()
    await client.post(
        f"/api/v1/items/{item_id}/maintenance",
        json={"performed_at": performed_at},
    )

    # Check item has updated last_maintenance_at
    response = await client.get(f"/api/v1/items/{item_id}")
    data = response.json()
    assert data["last_maintenance_at"] is not None


@pytest.mark.asyncio
async def test_maintenance_with_interval_sets_next_date(client: AsyncClient):
    """Test that logging maintenance with interval sets next_maintenance_at."""
    # Create item with interval
    item_response = await client.post(
        "/api/v1/items",
        json={"name": "Oil"},
    )
    item_id = item_response.json()["id"]

    # Set interval
    await client.put(
        f"/api/v1/items/{item_id}/schedule",
        json={"maintenance_interval_days": 30},
    )

    # Log maintenance
    performed_at = datetime.now(timezone.utc)
    await client.post(
        f"/api/v1/items/{item_id}/maintenance",
        json={"performed_at": performed_at.isoformat()},
    )

    # Check next maintenance is set
    response = await client.get(f"/api/v1/items/{item_id}")
    data = response.json()
    assert data["next_maintenance_at"] is not None
