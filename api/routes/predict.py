"""
POST /api/predict/colleges  - main prediction endpoint
POST /api/predict/chances   - check chances for a specific college
"""

from fastapi import APIRouter, HTTPException
import traceback
from api.models.schemas import (
    PredictCollegesRequest, PredictCollegesResponse,
    PredictChancesRequest,  PredictChancesResponse,
)
from phase4_prediction.predictor import predict_colleges, get_chances

router = APIRouter()


@router.post("/colleges", response_model=PredictCollegesResponse)
def predict_colleges_endpoint(body: PredictCollegesRequest):
    """
    Given a user's score, category and seat type,
    returns a ranked list of colleges they can get admission in.
    """
    try:
        results = predict_colleges(
            user_score=body.score,
            category=body.category,
            seat_type=body.seat_type,
            branch_names=body.branch_names,
            include_reach=body.include_reach,
            top_n=body.top_n,
        )
        return {
            "total":      len(results),
            "user_score": body.score,
            "category":   body.category,
            "seat_type":  body.seat_type,
            "colleges":   results,
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@router.post("/chances", response_model=PredictChancesResponse)
def predict_chances_endpoint(body: PredictChancesRequest):
    """
    Check admission chances for a specific college + branch combination.
    """
    try:
        result = get_chances(
            college_id=body.college_id,
            branch_id=body.branch_id,
            category=body.category,
            seat_type=body.seat_type,
            user_score=body.score,
        )
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Chances error: {str(e)}")
