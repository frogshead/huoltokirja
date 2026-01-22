import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.models.comment import Comment
    from app.models.document import Document
    from app.models.maintenance_log import MaintenanceLog


class Item(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "items"

    parent_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("items.id", ondelete="CASCADE"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Maintenance scheduling
    last_maintenance_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    next_maintenance_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    maintenance_interval_days: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True
    )

    # Relationships
    parent: Mapped[Optional["Item"]] = relationship(
        "Item", remote_side="Item.id", back_populates="children"
    )
    children: Mapped[list["Item"]] = relationship(
        "Item", back_populates="parent", cascade="all, delete-orphan"
    )
    documents: Mapped[list["Document"]] = relationship(
        "Document", back_populates="item", cascade="all, delete-orphan"
    )
    comments: Mapped[list["Comment"]] = relationship(
        "Comment", back_populates="item", cascade="all, delete-orphan"
    )
    maintenance_logs: Mapped[list["MaintenanceLog"]] = relationship(
        "MaintenanceLog", back_populates="item", cascade="all, delete-orphan"
    )
