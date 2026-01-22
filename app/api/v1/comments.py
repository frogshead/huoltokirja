import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.comment import CommentCreate, CommentUpdate, CommentResponse
from app.services import comment_service, item_service

router = APIRouter()


@router.get("/items/{item_id}/comments", response_model=list[CommentResponse])
async def list_item_comments(
    item_id: uuid.UUID, db: AsyncSession = Depends(get_db)
):
    """List all comments for an item."""
    # First verify item exists
    item = await item_service.get_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    return await comment_service.get_comments(db, item_id)


@router.post(
    "/items/{item_id}/comments",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_comment(
    item_id: uuid.UUID,
    comment_data: CommentCreate,
    db: AsyncSession = Depends(get_db),
):
    """Add a comment to an item."""
    comment = await comment_service.create_comment(db, item_id, comment_data)
    if not comment:
        raise HTTPException(status_code=404, detail="Item not found")
    return comment


@router.put("/comments/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: uuid.UUID,
    comment_data: CommentUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a comment."""
    comment = await comment_service.update_comment(db, comment_id, comment_data)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    return comment


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(comment_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """Delete a comment."""
    success = await comment_service.delete_comment(db, comment_id)
    if not success:
        raise HTTPException(status_code=404, detail="Comment not found")
