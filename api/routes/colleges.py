"""
GET /api/colleges              - list all colleges
GET /api/colleges/:id/history  - cutoff history + 2025 prediction
"""

from fastapi import APIRouter, Query, HTTPException
import traceback
from phase4_prediction.predictor import get_lookup, get_college_history

router = APIRouter()


@router.get("/")
def list_colleges(
    search: str | None = Query(None, description="Search by college name"),
    status: str | None = Query(None, description="Filter by status e.g. 'Government Autonomous'"),
):
    """List all colleges with optional search/filter."""
    try:
        lookup = get_lookup()
        if not lookup or "colleges" not in lookup:
            raise ValueError("Colleges data not found in lookup")
        
        colleges = lookup["colleges"]
        if search:
            colleges = [c for c in colleges if search.lower() in c.get("College Name", "").lower()]
        if status:
            colleges = [c for c in colleges if c.get("Status","") == status]
        return {"total": len(colleges), "colleges": colleges}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error listing colleges: {str(e)}")


@router.get("/{college_id}/history")
def college_cutoff_history(
    college_id: int,
    branch_id: str | None = Query(None, description="Filter to a specific branch"),
):
    """
    Returns year-by-year cutoff history + 2025 predicted cutoff
    for a college (optionally filtered by branch).
    """
    try:
        history = get_college_history(college_id, branch_id)
        if not history:
            return {"college_id": college_id, "message": "No data found", "history": [], "total": 0}
        return {
            "college_id":   college_id,
            "college_name": history[0].get("college_name", "Unknown"),
            "total":        len(history),
            "records":      history,
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching college history: {str(e)}")
