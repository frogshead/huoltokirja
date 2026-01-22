import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.comment import Comment
from app.models.item import Item
from app.schemas.comment import CommentCreate, CommentUpdate


async def get_comments(db: AsyncSession, item_id: uuid.UUID) -> list[Comment]:
    """Get all comments for an item."""
    result = await db.execute(
        select(Comment)
        .where(Comment.item_id == item_id)
        .order_by(Comment.created_at.desc())
    )
    return list(result.scalars().all())


async def get_comment(db: AsyncSession, comment_id: uuid.UUID) -> Comment | None:
    """Get a single comment by ID."""
    result = await db.execute(
        select(Comment).where(Comment.id == comment_id)
    )
    return result.scalar_one_or_none()


async def create_comment(
    db: AsyncSession, item_id: uuid.UUID, comment_data: CommentCreate
) -> Comment | None:
    """Create a new comment on an item."""
    # Check if item exists
    result = await db.execute(select(Item).where(Item.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        return None

    comment = Comment(
        item_id=item_id,
        content=comment_data.content,
    )
    db.add(comment)
    await db.flush()
    await db.refresh(comment)
    return comment


async def update_comment(
    db: AsyncSession, comment_id: uuid.UUID, comment_data: CommentUpdate
) -> Comment | None:
    """Update an existing comment."""
    comment = await get_comment(db, comment_id)
    if not comment:
        return None

    comment.content = comment_data.content
    await db.flush()
    await db.refresh(comment)
    return comment


async def delete_comment(db: AsyncSession, comment_id: uuid.UUID) -> bool:
    """Delete a comment."""
    comment = await get_comment(db, comment_id)
    if not comment:
        return False

    await db.delete(comment)
    return True
