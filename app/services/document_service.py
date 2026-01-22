import os
import uuid
from pathlib import Path

import aiofiles
from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.document import Document
from app.models.item import Item


async def get_documents(db: AsyncSession, item_id: uuid.UUID) -> list[Document]:
    """Get all documents for an item."""
    result = await db.execute(
        select(Document)
        .where(Document.item_id == item_id)
        .order_by(Document.uploaded_at.desc())
    )
    return list(result.scalars().all())


async def get_document(db: AsyncSession, document_id: uuid.UUID) -> Document | None:
    """Get a single document by ID."""
    result = await db.execute(
        select(Document).where(Document.id == document_id)
    )
    return result.scalar_one_or_none()


async def upload_document(
    db: AsyncSession,
    item_id: uuid.UUID,
    file: UploadFile,
    document_type: str | None = None,
) -> Document | None:
    """Upload a document and attach it to an item."""
    # Check if item exists
    result = await db.execute(select(Item).where(Item.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        return None

    # Generate unique filename
    file_ext = Path(file.filename).suffix if file.filename else ""
    unique_filename = f"{uuid.uuid4()}{file_ext}"

    # Create upload directory if needed
    upload_dir = Path(settings.uploads_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Save file
    file_path = upload_dir / unique_filename
    content = await file.read()
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    # Create document record
    document = Document(
        item_id=item_id,
        filename=unique_filename,
        original_filename=file.filename or "unknown",
        file_path=str(file_path),
        mime_type=file.content_type,
        file_size_bytes=len(content),
        document_type=document_type,
    )
    db.add(document)
    await db.flush()
    await db.refresh(document)
    return document


async def delete_document(db: AsyncSession, document_id: uuid.UUID) -> bool:
    """Delete a document and its file."""
    document = await get_document(db, document_id)
    if not document:
        return False

    # Delete file from filesystem
    try:
        if os.path.exists(document.file_path):
            os.remove(document.file_path)
    except OSError:
        pass  # File might not exist, that's okay

    await db.delete(document)
    return True


async def get_document_path(db: AsyncSession, document_id: uuid.UUID) -> tuple[str, str] | None:
    """Get the file path and original filename for downloading."""
    document = await get_document(db, document_id)
    if not document:
        return None
    return document.file_path, document.original_filename
