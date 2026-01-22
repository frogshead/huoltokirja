#!/usr/bin/env python3
"""
Populate the database with sample test data.

Usage:
    uv run python -m scripts.populate
    # or
    make populate
"""

import asyncio
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import async_session_maker, engine
from app.models import Base, Item, Comment, MaintenanceLog


async def clear_data(db: AsyncSession) -> None:
    """Clear all existing data."""
    # Delete in order respecting foreign keys (children first via cascade)
    await db.execute(select(Item).where(Item.parent_id.is_(None)))
    items = (await db.execute(select(Item).where(Item.parent_id.is_(None)))).scalars().all()
    for item in items:
        await db.delete(item)
    await db.commit()
    print("Cleared existing data")


async def create_sample_data(db: AsyncSession) -> None:
    """Create sample items, comments, and maintenance logs."""
    now = datetime.now(timezone.utc)

    # ========== HOUSE ==========
    house = Item(
        name="House",
        description="Main residence at 123 Main Street",
        maintenance_interval_days=365,
        last_maintenance_at=now - timedelta(days=300),
        next_maintenance_at=now + timedelta(days=65),
    )
    db.add(house)
    await db.flush()

    # HVAC System
    hvac = Item(
        name="HVAC System",
        description="Central heating and cooling unit, installed 2020",
        parent_id=house.id,
        maintenance_interval_days=180,
        last_maintenance_at=now - timedelta(days=90),
        next_maintenance_at=now + timedelta(days=90),
    )
    db.add(hvac)
    await db.flush()

    hvac_filter = Item(
        name="Air Filter",
        description="MERV 13 filter, 20x25x1",
        parent_id=hvac.id,
        maintenance_interval_days=90,
        last_maintenance_at=now - timedelta(days=85),
        next_maintenance_at=now + timedelta(days=5),
    )
    db.add(hvac_filter)

    hvac_coils = Item(
        name="Evaporator Coils",
        description="Should be cleaned annually",
        parent_id=hvac.id,
        maintenance_interval_days=365,
        last_maintenance_at=now - timedelta(days=200),
        next_maintenance_at=now + timedelta(days=165),
    )
    db.add(hvac_coils)

    # Plumbing
    plumbing = Item(
        name="Plumbing",
        description="House plumbing system",
        parent_id=house.id,
    )
    db.add(plumbing)
    await db.flush()

    water_heater = Item(
        name="Water Heater",
        description="50 gallon electric, installed 2019",
        parent_id=plumbing.id,
        maintenance_interval_days=365,
        last_maintenance_at=now - timedelta(days=400),
        next_maintenance_at=now - timedelta(days=35),  # OVERDUE
    )
    db.add(water_heater)

    # Roof
    roof = Item(
        name="Roof",
        description="Asphalt shingles, installed 2015",
        parent_id=house.id,
        maintenance_interval_days=365,
    )
    db.add(roof)

    # ========== CAR ==========
    car = Item(
        name="Car",
        description="2021 Toyota Camry, VIN: 1234567890",
        maintenance_interval_days=180,
        last_maintenance_at=now - timedelta(days=120),
        next_maintenance_at=now + timedelta(days=60),
    )
    db.add(car)
    await db.flush()

    engine = Item(
        name="Engine",
        description="2.5L 4-cylinder",
        parent_id=car.id,
    )
    db.add(engine)
    await db.flush()

    oil = Item(
        name="Engine Oil",
        description="0W-20 synthetic, 5 quarts",
        parent_id=engine.id,
        maintenance_interval_days=120,
        last_maintenance_at=now - timedelta(days=100),
        next_maintenance_at=now + timedelta(days=20),
    )
    db.add(oil)

    oil_filter = Item(
        name="Oil Filter",
        description="Toyota OEM filter",
        parent_id=engine.id,
        maintenance_interval_days=120,
        last_maintenance_at=now - timedelta(days=100),
        next_maintenance_at=now + timedelta(days=20),
    )
    db.add(oil_filter)

    air_filter = Item(
        name="Air Filter",
        description="Engine air filter",
        parent_id=engine.id,
        maintenance_interval_days=365,
        last_maintenance_at=now - timedelta(days=200),
        next_maintenance_at=now + timedelta(days=165),
    )
    db.add(air_filter)

    # Tires
    tires = Item(
        name="Tires",
        description="Michelin Defender, 225/45R17",
        parent_id=car.id,
        maintenance_interval_days=180,
        last_maintenance_at=now - timedelta(days=60),
        next_maintenance_at=now + timedelta(days=120),
    )
    db.add(tires)

    # Brakes
    brakes = Item(
        name="Brakes",
        description="Disc brakes, front and rear",
        parent_id=car.id,
        maintenance_interval_days=365,
    )
    db.add(brakes)
    await db.flush()

    brake_pads = Item(
        name="Brake Pads",
        description="Ceramic brake pads",
        parent_id=brakes.id,
        maintenance_interval_days=730,
        last_maintenance_at=now - timedelta(days=400),
        next_maintenance_at=now + timedelta(days=330),
    )
    db.add(brake_pads)

    # ========== BIKE ==========
    bike = Item(
        name="Bicycle",
        description="Trek mountain bike",
        maintenance_interval_days=90,
    )
    db.add(bike)
    await db.flush()

    bike_chain = Item(
        name="Chain",
        description="10-speed chain, needs regular lubrication",
        parent_id=bike.id,
        maintenance_interval_days=30,
        last_maintenance_at=now - timedelta(days=45),
        next_maintenance_at=now - timedelta(days=15),  # OVERDUE
    )
    db.add(bike_chain)

    bike_tires = Item(
        name="Tires",
        description="27.5 inch mountain tires",
        parent_id=bike.id,
        maintenance_interval_days=180,
    )
    db.add(bike_tires)

    bike_brakes = Item(
        name="Disc Brakes",
        description="Hydraulic disc brakes",
        parent_id=bike.id,
        maintenance_interval_days=365,
    )
    db.add(bike_brakes)

    await db.flush()

    # ========== COMMENTS ==========
    comments_data = [
        (house.id, "Annual inspection scheduled for next month"),
        (house.id, "Need to check gutters before winter"),
        (hvac.id, "Technician recommended upgrading to smart thermostat"),
        (water_heater.id, "Noticed some rust around the base, monitor closely"),
        (water_heater.id, "Consider replacing in next 2-3 years"),
        (car.id, "Due for state inspection in March"),
        (oil.id, "Switched to synthetic oil last change"),
        (tires.id, "Rotated and balanced, even wear pattern"),
        (bike_chain.id, "Chain is getting stretched, may need replacement soon"),
    ]

    for item_id, content in comments_data:
        comment = Comment(item_id=item_id, content=content)
        db.add(comment)

    # ========== MAINTENANCE LOGS ==========
    logs_data = [
        (hvac_filter.id, now - timedelta(days=85), "Replaced MERV 13 filter"),
        (hvac_filter.id, now - timedelta(days=175), "Replaced filter, was very dirty"),
        (hvac_filter.id, now - timedelta(days=265), "Regular filter replacement"),
        (hvac.id, now - timedelta(days=90), "Annual HVAC service - cleaned coils, checked refrigerant"),
        (hvac.id, now - timedelta(days=455), "Annual service and tune-up"),
        (oil.id, now - timedelta(days=100), "Oil change at 45,000 miles"),
        (oil.id, now - timedelta(days=220), "Oil change at 40,000 miles"),
        (oil.id, now - timedelta(days=340), "Oil change at 35,000 miles"),
        (tires.id, now - timedelta(days=60), "Tire rotation and balance"),
        (tires.id, now - timedelta(days=240), "Tire rotation"),
        (car.id, now - timedelta(days=120), "Full service - oil, filters, inspection"),
        (bike_chain.id, now - timedelta(days=45), "Cleaned and lubricated chain"),
        (bike_chain.id, now - timedelta(days=75), "Chain lubrication"),
    ]

    for item_id, performed_at, notes in logs_data:
        log = MaintenanceLog(
            item_id=item_id,
            performed_at=performed_at,
            notes=notes,
        )
        db.add(log)

    await db.commit()
    print("Created sample data successfully")


async def print_summary(db: AsyncSession) -> None:
    """Print a summary of the data in the database."""
    # Count items
    result = await db.execute(select(Item))
    items = result.scalars().all()

    root_items = [i for i in items if i.parent_id is None]

    result = await db.execute(select(Comment))
    comments = result.scalars().all()

    result = await db.execute(select(MaintenanceLog))
    logs = result.scalars().all()

    # Find overdue items
    now = datetime.now(timezone.utc)
    overdue = [i for i in items if i.next_maintenance_at and i.next_maintenance_at < now]

    print("\n" + "=" * 50)
    print("DATABASE SUMMARY")
    print("=" * 50)
    print(f"Total items:        {len(items)}")
    print(f"Root items:         {len(root_items)}")
    print(f"Comments:           {len(comments)}")
    print(f"Maintenance logs:   {len(logs)}")
    print(f"Items overdue:      {len(overdue)}")

    print("\nRoot items:")
    for item in root_items:
        child_count = len([i for i in items if i.parent_id == item.id])
        print(f"  - {item.name} ({child_count} direct children)")

    if overdue:
        print("\nOverdue items:")
        for item in overdue:
            days_overdue = (now - item.next_maintenance_at).days
            print(f"  - {item.name} ({days_overdue} days overdue)")

    print("=" * 50)


async def main() -> None:
    """Main function to populate the database."""
    print("Huoltokirja - Database Population Script")
    print("-" * 40)

    # Create tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session_maker() as db:
        # Check if data already exists
        result = await db.execute(select(Item).limit(1))
        existing = result.scalar_one_or_none()

        if existing:
            print("\nData already exists in database.")
            response = input("Clear existing data and repopulate? [y/N]: ")
            if response.lower() != "y":
                print("Aborted.")
                await print_summary(db)
                return
            await clear_data(db)

        await create_sample_data(db)
        await print_summary(db)


if __name__ == "__main__":
    asyncio.run(main())
