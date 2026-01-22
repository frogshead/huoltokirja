import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class MaintenanceLogBase(BaseModel):
    performed_at: datetime
    notes: Optional[str] = None


class MaintenanceLogCreate(MaintenanceLogBase):
    pass


class MaintenanceLogResponse(MaintenanceLogBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    item_id: uuid.UUID
    created_at: datetime
