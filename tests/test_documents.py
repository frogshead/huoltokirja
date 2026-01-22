import io

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_upload_document(client: AsyncClient):
    """Test uploading a document."""
    # Create item
    item_response = await client.post(
        "/api/v1/items",
        json={"name": "Car"},
    )
    item_id = item_response.json()["id"]

    # Upload document
    file_content = b"Test file content"
    response = await client.post(
        f"/api/v1/items/{item_id}/documents",
        files={"file": ("test.txt", io.BytesIO(file_content), "text/plain")},
        data={"document_type": "manual"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["original_filename"] == "test.txt"
    assert data["mime_type"] == "text/plain"
    assert data["document_type"] == "manual"
    assert data["file_size_bytes"] == len(file_content)


@pytest.mark.asyncio
async def test_list_documents(client: AsyncClient):
    """Test listing documents for an item."""
    # Create item
    item_response = await client.post(
        "/api/v1/items",
        json={"name": "House"},
    )
    item_id = item_response.json()["id"]

    # Upload documents
    for i in range(2):
        await client.post(
            f"/api/v1/items/{item_id}/documents",
            files={"file": (f"doc{i}.txt", io.BytesIO(b"content"), "text/plain")},
        )

    # List documents
    response = await client.get(f"/api/v1/items/{item_id}/documents")
    assert response.status_code == 200
    docs = response.json()
    assert len(docs) == 2


@pytest.mark.asyncio
async def test_download_document(client: AsyncClient):
    """Test downloading a document."""
    # Create item
    item_response = await client.post(
        "/api/v1/items",
        json={"name": "Bike"},
    )
    item_id = item_response.json()["id"]

    # Upload document
    file_content = b"Original content for download"
    upload_response = await client.post(
        f"/api/v1/items/{item_id}/documents",
        files={"file": ("download.txt", io.BytesIO(file_content), "text/plain")},
    )
    doc_id = upload_response.json()["id"]

    # Download document
    response = await client.get(f"/api/v1/documents/{doc_id}/download")
    assert response.status_code == 200
    assert response.content == file_content


@pytest.mark.asyncio
async def test_delete_document(client: AsyncClient):
    """Test deleting a document."""
    # Create item
    item_response = await client.post(
        "/api/v1/items",
        json={"name": "Boat"},
    )
    item_id = item_response.json()["id"]

    # Upload document
    upload_response = await client.post(
        f"/api/v1/items/{item_id}/documents",
        files={"file": ("delete.txt", io.BytesIO(b"delete me"), "text/plain")},
    )
    doc_id = upload_response.json()["id"]

    # Delete document
    response = await client.delete(f"/api/v1/documents/{doc_id}")
    assert response.status_code == 204

    # Verify deleted
    response = await client.get(f"/api/v1/documents/{doc_id}/download")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_upload_document_item_not_found(client: AsyncClient):
    """Test uploading to non-existent item."""
    response = await client.post(
        "/api/v1/items/00000000-0000-0000-0000-000000000000/documents",
        files={"file": ("test.txt", io.BytesIO(b"content"), "text/plain")},
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_list_documents_item_not_found(client: AsyncClient):
    """Test listing documents for non-existent item."""
    response = await client.get(
        "/api/v1/items/00000000-0000-0000-0000-000000000000/documents"
    )
    assert response.status_code == 404
