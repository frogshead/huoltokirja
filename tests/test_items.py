import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_items_empty(client: AsyncClient):
    """Test listing items when there are none."""
    response = await client.get("/api/v1/items")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_create_item(client: AsyncClient):
    """Test creating a root item."""
    response = await client.post(
        "/api/v1/items",
        json={"name": "House", "description": "My house"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "House"
    assert data["description"] == "My house"
    assert data["parent_id"] is None
    assert "id" in data


@pytest.mark.asyncio
async def test_get_item(client: AsyncClient):
    """Test getting a single item."""
    # Create item first
    create_response = await client.post(
        "/api/v1/items",
        json={"name": "Car"},
    )
    item_id = create_response.json()["id"]

    # Get item
    response = await client.get(f"/api/v1/items/{item_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Car"
    assert data["children"] == []


@pytest.mark.asyncio
async def test_get_item_not_found(client: AsyncClient):
    """Test getting a non-existent item."""
    response = await client.get("/api/v1/items/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_item(client: AsyncClient):
    """Test updating an item."""
    # Create item
    create_response = await client.post(
        "/api/v1/items",
        json={"name": "Bike"},
    )
    item_id = create_response.json()["id"]

    # Update item
    response = await client.put(
        f"/api/v1/items/{item_id}",
        json={"name": "Mountain Bike", "description": "A nice bike"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Mountain Bike"
    assert data["description"] == "A nice bike"


@pytest.mark.asyncio
async def test_delete_item(client: AsyncClient):
    """Test deleting an item."""
    # Create item
    create_response = await client.post(
        "/api/v1/items",
        json={"name": "Boat"},
    )
    item_id = create_response.json()["id"]

    # Delete item
    response = await client.delete(f"/api/v1/items/{item_id}")
    assert response.status_code == 204

    # Verify it's deleted
    response = await client.get(f"/api/v1/items/{item_id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_child_item(client: AsyncClient):
    """Test creating a child item."""
    # Create parent
    parent_response = await client.post(
        "/api/v1/items",
        json={"name": "Car"},
    )
    parent_id = parent_response.json()["id"]

    # Create child
    child_response = await client.post(
        f"/api/v1/items/{parent_id}/children",
        json={"name": "Engine"},
    )
    assert child_response.status_code == 201
    child_data = child_response.json()
    assert child_data["name"] == "Engine"
    assert child_data["parent_id"] == parent_id

    # Verify parent has child
    parent_get = await client.get(f"/api/v1/items/{parent_id}")
    parent_data = parent_get.json()
    assert len(parent_data["children"]) == 1
    assert parent_data["children"][0]["name"] == "Engine"


@pytest.mark.asyncio
async def test_delete_parent_cascades_to_children(client: AsyncClient):
    """Test that deleting a parent also deletes children."""
    # Create parent
    parent_response = await client.post(
        "/api/v1/items",
        json={"name": "House"},
    )
    parent_id = parent_response.json()["id"]

    # Create child
    child_response = await client.post(
        f"/api/v1/items/{parent_id}/children",
        json={"name": "HVAC"},
    )
    child_id = child_response.json()["id"]

    # Delete parent
    await client.delete(f"/api/v1/items/{parent_id}")

    # Verify child is also deleted
    response = await client.get(f"/api/v1/items/{child_id}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_list_root_items(client: AsyncClient):
    """Test listing only root items."""
    # Create root items
    await client.post("/api/v1/items", json={"name": "House"})
    car_response = await client.post("/api/v1/items", json={"name": "Car"})
    car_id = car_response.json()["id"]

    # Create child item
    await client.post(f"/api/v1/items/{car_id}/children", json={"name": "Engine"})

    # List should only show root items
    response = await client.get("/api/v1/items")
    assert response.status_code == 200
    items = response.json()
    assert len(items) == 2
    names = [item["name"] for item in items]
    assert "House" in names
    assert "Car" in names
    assert "Engine" not in names
