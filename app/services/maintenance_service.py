import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.item import Item
from app.models.maintenance_log import MaintenanceLog
from app.schemas.maintenance_log import MaintenanceLogCreate


async def log_maintenance(
    db: AsyncSession, item_id: uuid.UUID, log_data: MaintenanceLogCreate
) -> MaintenanceLog | None:
    """Log that maintenance was performed on an item."""
    # First check if item exists
    result = await db.execute(select(Item).where(Item.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        return None

    # Create the log entry
    log = MaintenanceLog(
        item_id=item_id,
        performed_at=log_data.performed_at,
        notes=log_data.notes,
    )
    db.add(log)

    # Update the item's last_maintenance_at
    item.last_maintenance_at = log_data.performed_at

    # If interval-based, calculate next maintenance date
    if item.maintenance_interval_days:
        item.next_maintenance_at = log_data.performed_at + timedelta(
            days=item.maintenance_interval_days
        )

    await db.flush()
    await db.refresh(log)
    return log


async def get_maintenance_logs(
    db: AsyncSession, item_id: uuid.UUID
) -> list[MaintenanceLog]:
    """Get all maintenance logs for an item."""
    result = await db.execute(
        select(MaintenanceLog)
        .where(MaintenanceLog.item_id == item_id)
        .order_by(MaintenanceLog.performed_at.desc())
    )
    return list(result.scalars().all())


async def log_maintenance_now(
    db: AsyncSession, item_id: uuid.UUID, notes: str | None = None
) -> MaintenanceLog | None:
    """Convenience method to log maintenance as performed now."""
    log_data = MaintenanceLogCreate(
        performed_at=datetime.now(timezone.utc),
        notes=notes,
    )
    return await log_maintenance(db, item_id, log_data)
