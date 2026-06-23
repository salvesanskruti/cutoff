"""
API request and response schemas (Pydantic models)
"""

from pydantic import BaseModel, Field
from typing import Optional


# ── Request bodies ─────────────────────────────────────────────────────────

class PredictCollegesRequest(BaseModel):
    score: float = Field(..., ge=0, le=100, example=85.5,
                         description="Your MHT CET percentile score (0-100)")
    category: str = Field(..., example="GOPENS",
                          description="Your reservation category code e.g. GOPENS, GSCS, LSCS")
    seat_type: str = Field(..., example="State Level",
                           description="State Level / Home University / Home University to Other / Other Than Home University")
    branch_names: Optional[list[str]] = Field(None,
                                              example=["Computer Engineering", "Information Technology"],
                                              description="Filter by specific branches. Leave empty for all branches.")
    include_reach: bool = Field(True, description="Include colleges where score is slightly below cutoff (reach colleges)")
    top_n: int = Field(50, ge=1, le=200, description="Max number of results to return")


class PredictChancesRequest(BaseModel):
    score: float = Field(..., ge=0, le=100, example=85.5)
    college_id: int = Field(..., example=1002)
    branch_id: str = Field(..., example="100219110")
    category: str = Field(..., example="GOPENS")
    seat_type: str = Field(..., example="State Level")


# ── Response models ────────────────────────────────────────────────────────

class ChanceInfo(BaseModel):
    label: str          # Safe / Moderate / Reach / Unlikely
    color: str          # green / yellow / orange / red
    desc: str
    gap: float          # score - cutoff (positive = above)


class CollegePrediction(BaseModel):
    college_id: int
    college_name: str
    branch_id: str
    branch_name: str
    seat_type: str
    category: str
    status: str
    is_state_level: bool
    predicted_cutoff_2025: float
    score_2022: Optional[float]
    score_2023: Optional[float]
    score_2024: Optional[float]
    chance: ChanceInfo


class PredictCollegesResponse(BaseModel):
    total: int
    user_score: float
    category: str
    seat_type: str
    colleges: list[CollegePrediction]


class HistoryEntry(BaseModel):
    year_2022: Optional[float] = Field(None, alias="2022")
    year_2023: Optional[float] = Field(None, alias="2023")
    year_2024: Optional[float] = Field(None, alias="2024")
    year_2025_predicted: Optional[float] = Field(None, alias="2025_predicted")

    class Config:
        populate_by_name = True


class CollegeHistoryItem(BaseModel):
    college_id: int
    college_name: str
    branch_name: str
    category: str
    seat_type: str
    history: dict


class PredictChancesResponse(BaseModel):
    college_name: str
    branch_name: str
    user_score: float
    cutoff_2025: float
    chance: ChanceInfo
    history: dict


class FiltersResponse(BaseModel):
    branches: list[str]
    categories: list[str]
    category_groups: list[str]
    seat_types: list[str]
