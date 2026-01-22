import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.document import DocumentResponse
from app.services import document_service, item_service

router = APIRouter()


@router.get("/items/{item_id}/documents", response_model=list[DocumentResponse])
async def list_item_documents(
    item_id: uuid.UUID, db: AsyncSession = Depends(get_db)
):
    """List all documents for an item."""
    # First verify item exists
    item = await item_service.get_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    return await document_service.get_documents(db, item_id)


@router.post(
    "/items/{item_id}/documents",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    item_id: uuid.UUID,
    file: UploadFile = File(...),
    document_type: str | None = Form(None),
    db: AsyncSession = Depends(get_db),
):
    """Upload a document and attach it to an item."""
    document = await document_service.upload_document(db, item_id, file, document_type)
    if not document:
        raise HTTPException(status_code=404, detail="Item not found")
    return document


@router.get("/documents/{document_id}/download")
async def download_document(
    document_id: uuid.UUID, db: AsyncSession = Depends(get_db)
):
    """Download a document."""
    result = await document_service.get_document_path(db, document_id)
    if not result:
        raise HTTPException(status_code=404, detail="Document not found")

    file_path, original_filename = result
    return FileResponse(
        path=file_path,
        filename=original_filename,
        media_type="application/octet-stream",
    )


@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(document_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Delete a document."""
    success = await document_service.delete_document(db, document_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
