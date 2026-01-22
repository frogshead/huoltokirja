from fastapi import APIRouter

from app.api.v1 import items, documents, comments

router = APIRouter()

router.include_router(items.router, prefix="/items", tags=["items"])
router.include_router(documents.router, tags=["documents"])
router.include_router(comments.router, tags=["comments"])
