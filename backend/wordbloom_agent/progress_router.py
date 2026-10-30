"""
WordBloom — progress_router.py
===============================
FastAPI router for student progress endpoints.
"""

from fastapi import APIRouter
from .progress import compute_progress

progress_router = APIRouter()


@progress_router.get("/children/{child_id}/progress")
@progress_router.get("/api/children/{child_id}/progress")
async def get_child_progress(child_id: str):
    """
    Returns progress comparison (previous -> current session)
    and history of recent sessions for the given child.
    """
    clean_id = (child_id or "emma").lower().strip()
    return compute_progress(clean_id)

