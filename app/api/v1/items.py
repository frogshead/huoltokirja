import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.item import (
    ItemCreate,
    ItemUpdate,
    ItemScheduleUpdate,
    ItemResponse,
    ItemWithChildrenResponse,
)
from app.schemas.maintenance_log import MaintenanceLogCreate, MaintenanceLogResponse
from app.services import item_service, maintenance_service

router = APIRouter()


@router.get("", response_model=list[ItemResponse])
async def list_root_items(db: AsyncSession = Depends(get_db)):
    """List all root-level items (items without a parent)."""
    return await item_service.get_root_items(db)


@router.post("", response_model=ItemResponse, status_code=status.HTTP_201_CREATED)
async def create_root_item(item_data: ItemCreate, db: AsyncSession = Depends(get_db)):
    """Create a new root-level item."""
    return await item_service.create_item(db, item_data)


@router.get("/due", response_model=list[ItemResponse])
async def list_items_due_for_maintenance(db: AsyncSession = Depends(get_db)):
    """List all items that are due for maintenance."""
    return await item_service.get_items_due_for_maintenance(db)


@router.get("/{item_id}", response_model=ItemWithChildrenResponse)
async def get_item(item_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Get a single item with its children."""
    item = await item_service.get_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.put("/{item_id}", response_model=ItemResponse)
async def update_item(
    item_id: uuid.UUID, item_data: ItemUpdate, db: AsyncSession = Depends(get_db)
):
    """Update an existing item."""
    item = await item_service.update_item(db, item_id, item_data)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(item_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Delete an item and all its children."""
    success = await item_service.delete_item(db, item_id)
    if not success:
        raise HTTPException(status_code=404, detail="Item not found")


@router.post(
    "/{item_id}/children", response_model=ItemResponse, status_code=status.HTTP_201_CREATED
)
async def create_child_item(
    item_id: uuid.UUID, item_data: ItemCreate, db: AsyncSession = Depends(get_db)
):
    """Create a child item under an existing item."""
    # First verify parent exists
    parent = await item_service.get_item(db, item_id)
    if not parent:
        raise HTTPException(status_code=404, detail="Parent item not found")

    return await item_service.create_item(db, item_data, parent_id=item_id)


@router.put("/{item_id}/schedule", response_model=ItemResponse)
async def update_maintenance_schedule(
    item_id: uuid.UUID,
    schedule_data: ItemScheduleUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Set or update the maintenance schedule for an item."""
    item = await item_service.update_item_schedule(db, item_id, schedule_data)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.post(
    "/{item_id}/maintenance",
    response_model=MaintenanceLogResponse,
    status_code=status.HTTP_201_CREATED,
)
async def log_maintenance(
    item_id: uuid.UUID,
    log_data: MaintenanceLogCreate,
    db: AsyncSession = Depends(get_db),
):
    """Log that maintenance was performed on an item."""
    log = await maintenance_service.log_maintenance(db, item_id, log_data)
    if not log:
        raise HTTPException(status_code=404, detail="Item not found")
    return log


@router.get("/{item_id}/maintenance", response_model=list[MaintenanceLogResponse])
async def get_maintenance_history(
    item_id: uuid.UUID, db: AsyncSession = Depends(get_db)
):
    """Get the maintenance history for an item."""
    # First verify item exists
    item = await item_service.get_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    return await maintenance_service.get_maintenance_logs(db, item_id)
