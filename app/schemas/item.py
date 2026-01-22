import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ItemBase(BaseModel):
    name: str
    description: Optional[str] = None


class ItemCreate(ItemBase):
    pass


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class ItemScheduleUpdate(BaseModel):
    next_maintenance_at: Optional[datetime] = None
    maintenance_interval_days: Optional[int] = None


class ItemResponse(ItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    parent_id: Optional[uuid.UUID] = None
    last_maintenance_at: Optional[datetime] = None
    next_maintenance_at: Optional[datetime] = None
    maintenance_interval_days: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class ItemWithChildrenResponse(ItemResponse):
    children: list["ItemResponse"] = []


# Enable forward reference resolution
ItemWithChildrenResponse.model_rebuild()
