"""
GET /api/filters/branches
GET /api/filters/categories
GET /api/filters/seat-types
GET /api/filters/all
"""

from fastapi import APIRouter, HTTPException
import traceback
from phase4_prediction.predictor import get_lookup

router = APIRouter()


@router.get("/branches")
def get_branches():
    """All unique branch names for dropdown filters."""
    try:
        lookup = get_lookup()
        if not lookup or "branches" not in lookup:
            raise ValueError("Branches data not found in lookup")
        return {"branches": lookup["branches"]}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching branches: {str(e)}")


@router.get("/categories")
def get_categories():
    """All unique category codes with their group mappings."""
    try:
        lookup = get_lookup()
        if not lookup:
            raise ValueError("Lookup data not found")
        return {
            "categories":       lookup.get("categories", []),
            "category_groups":  lookup.get("category_groups", {}),
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching categories: {str(e)}")


@router.get("/seat-types")
def get_seat_types():
    """All seat type options."""
    try:
        lookup = get_lookup()
        if not lookup or "seat_types" not in lookup:
            raise ValueError("Seat types data not found in lookup")
        return {"seat_types": lookup["seat_types"]}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching seat types: {str(e)}")


@router.get("/all")
def get_all_filters():
    """All filter options in one call — use this on app load."""
    try:
        lookup = get_lookup()
        if not lookup:
            raise ValueError("Lookup data not found")
        return {
            "branches":        lookup.get("branches", []),
            "categories":      lookup.get("categories", []),
            "category_groups": lookup.get("category_groups", {}),
            "seat_types":      lookup.get("seat_types", []),
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error fetching filters: {str(e)}")
