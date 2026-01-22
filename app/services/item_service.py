import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.item import Item
from app.schemas.item import ItemCreate, ItemUpdate, ItemScheduleUpdate


async def get_root_items(db: AsyncSession) -> list[Item]:
    """Get all root-level items (items without a parent)."""
    result = await db.execute(
        select(Item).where(Item.parent_id.is_(None)).order_by(Item.name)
    )
    return list(result.scalars().all())


async def get_item(db: AsyncSession, item_id: uuid.UUID) -> Item | None:
    """Get a single item by ID with its children loaded."""
    result = await db.execute(
        select(Item)
        .where(Item.id == item_id)
        .options(selectinload(Item.children))
    )
    return result.scalar_one_or_none()


async def create_item(
    db: AsyncSession, item_data: ItemCreate, parent_id: uuid.UUID | None = None
) -> Item:
    """Create a new item, optionally as a child of another item."""
    item = Item(
        name=item_data.name,
        description=item_data.description,
        parent_id=parent_id,
    )
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return item


async def update_item(
    db: AsyncSession, item_id: uuid.UUID, item_data: ItemUpdate
) -> Item | None:
    """Update an existing item."""
    item = await get_item(db, item_id)
    if not item:
        return None

    update_dict = item_data.model_dump(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(item, field, value)

    await db.flush()
    await db.refresh(item)
    return item


async def delete_item(db: AsyncSession, item_id: uuid.UUID) -> bool:
    """Delete an item and all its children (cascade)."""
    item = await get_item(db, item_id)
    if not item:
        return False

    await db.delete(item)
    return True


async def update_item_schedule(
    db: AsyncSession, item_id: uuid.UUID, schedule_data: ItemScheduleUpdate
) -> Item | None:
    """Update maintenance schedule for an item."""
    item = await get_item(db, item_id)
    if not item:
        return None

    if schedule_data.next_maintenance_at is not None:
        item.next_maintenance_at = schedule_data.next_maintenance_at
    if schedule_data.maintenance_interval_days is not None:
        item.maintenance_interval_days = schedule_data.maintenance_interval_days

    await db.flush()
    await db.refresh(item)
    return item


async def get_items_due_for_maintenance(db: AsyncSession) -> list[Item]:
    """Get all items that are due for maintenance."""
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(Item)
        .where(Item.next_maintenance_at.isnot(None))
        .where(Item.next_maintenance_at <= now)
        .order_by(Item.next_maintenance_at)
    )
    return list(result.scalars().all())
