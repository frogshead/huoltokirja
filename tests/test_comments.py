import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_comment(client: AsyncClient):
    """Test creating a comment on an item."""
    # Create item
    item_response = await client.post(
        "/api/v1/items",
        json={"name": "Car"},
    )
    item_id = item_response.json()["id"]

    # Create comment
    response = await client.post(
        f"/api/v1/items/{item_id}/comments",
        json={"content": "This is a test comment"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["content"] == "This is a test comment"
    assert data["item_id"] == item_id


@pytest.mark.asyncio
async def test_list_comments(client: AsyncClient):
    """Test listing comments for an item."""
    # Create item
    item_response = await client.post(
        "/api/v1/items",
        json={"name": "House"},
    )
    item_id = item_response.json()["id"]

    # Create comments
    for i in range(3):
        await client.post(
            f"/api/v1/items/{item_id}/comments",
            json={"content": f"Comment #{i+1}"},
        )

    # List comments
    response = await client.get(f"/api/v1/items/{item_id}/comments")
    assert response.status_code == 200
    comments = response.json()
    assert len(comments) == 3


@pytest.mark.asyncio
async def test_update_comment(client: AsyncClient):
    """Test updating a comment."""
    # Create item
    item_response = await client.post(
        "/api/v1/items",
        json={"name": "Bike"},
    )
    item_id = item_response.json()["id"]

    # Create comment
    create_response = await client.post(
        f"/api/v1/items/{item_id}/comments",
        json={"content": "Original content"},
    )
    comment_id = create_response.json()["id"]

    # Update comment
    response = await client.put(
        f"/api/v1/comments/{comment_id}",
        json={"content": "Updated content"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["content"] == "Updated content"


@pytest.mark.asyncio
async def test_delete_comment(client: AsyncClient):
    """Test deleting a comment."""
    # Create item
    item_response = await client.post(
        "/api/v1/items",
        json={"name": "Boat"},
    )
    item_id = item_response.json()["id"]

    # Create comment
    create_response = await client.post(
        f"/api/v1/items/{item_id}/comments",
        json={"content": "Delete me"},
    )
    comment_id = create_response.json()["id"]

    # Delete comment
    response = await client.delete(f"/api/v1/comments/{comment_id}")
    assert response.status_code == 204

    # Verify deleted (listing should be empty)
    response = await client.get(f"/api/v1/items/{item_id}/comments")
    assert response.json() == []


@pytest.mark.asyncio
async def test_create_comment_item_not_found(client: AsyncClient):
    """Test creating a comment on non-existent item."""
    response = await client.post(
        "/api/v1/items/00000000-0000-0000-0000-000000000000/comments",
        json={"content": "Test"},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_comment_not_found(client: AsyncClient):
    """Test updating a non-existent comment."""
    response = await client.put(
        "/api/v1/comments/00000000-0000-0000-0000-000000000000",
        json={"content": "Test"},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_comment_not_found(client: AsyncClient):
    """Test deleting a non-existent comment."""
    response = await client.delete(
        "/api/v1/comments/00000000-0000-0000-0000-000000000000"
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_list_comments_item_not_found(client: AsyncClient):
    """Test listing comments for non-existent item."""
    response = await client.get(
        "/api/v1/items/00000000-0000-0000-0000-000000000000/comments"
    )
    assert response.status_code == 404
