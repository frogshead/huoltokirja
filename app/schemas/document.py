import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class DocumentBase(BaseModel):
    document_type: Optional[str] = None


class DocumentCreate(DocumentBase):
    pass


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    item_id: uuid.UUID
    filename: str
    original_filename: str
    mime_type: Optional[str] = None
    file_size_bytes: Optional[int] = None
    document_type: Optional[str] = None
    uploaded_at: datetime
