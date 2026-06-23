"""
Phase 4 - Prediction Logic
This module is imported by the API. Not run directly.
"""

import pandas as pd
import numpy as np
import pickle
from functools import lru_cache
import os

# Get the absolute path to the project root
# predictor.py is at: .../college_predictor/phase4_prediction/predictor.py
# So we go up 2 levels to get to college_predictor
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(PROJECT_ROOT, "data", "processed")

PREDICTIONS_FILE   = os.path.join(DATA_DIR, "predictions_2025.csv")
LOOKUP_FILE        = os.path.join(DATA_DIR, "lookup_data.pkl")
MODEL_FILE         = os.path.join(DATA_DIR, "model.pkl")
ENCODERS_FILE      = os.path.join(DATA_DIR, "label_encoders.pkl")

# ── Singleton loaders (loaded once at API startup) ──────────────────────────

_predictions_df = None
_lookup_data    = None
_model_payload  = None
_encoders       = None

def load_all():
    global _predictions_df, _lookup_data, _model_payload, _encoders
    try:
        print(f"📂 Loading from: {DATA_DIR}")
        
        if not os.path.exists(PREDICTIONS_FILE):
            raise FileNotFoundError(f"Predictions file not found: {PREDICTIONS_FILE}")
        
        _predictions_df = pd.read_csv(PREDICTIONS_FILE)
        print(f"✅ Predictions loaded: {len(_predictions_df)} rows")
        
        if not os.path.exists(LOOKUP_FILE):
            raise FileNotFoundError(f"Lookup file not found: {LOOKUP_FILE}")
        with open(LOOKUP_FILE, "rb") as f:
            _lookup_data = pickle.load(f)
        print(f"✅ Lookup data loaded")
        
        if not os.path.exists(MODEL_FILE):
            raise FileNotFoundError(f"Model file not found: {MODEL_FILE}")
        with open(MODEL_FILE, "rb") as f:
            _model_payload = pickle.load(f)
        print(f"✅ Model loaded")
        
        if not os.path.exists(ENCODERS_FILE):
            raise FileNotFoundError(f"Encoders file not found: {ENCODERS_FILE}")
        with open(ENCODERS_FILE, "rb") as f:
            _encoders = pickle.load(f)
        print(f"✅ Encoders loaded")
        
        print("✅ All predictor data loaded successfully!")
    except Exception as e:
        print(f"❌ Error loading predictor data: {e}")
        raise

def get_predictions_df():
    if _predictions_df is None:
        load_all()
    return _predictions_df

def get_lookup():
    if _lookup_data is None:
        load_all()
    return _lookup_data

# ── Core prediction functions ────────────────────────────────────────────────

CHANCE_LABELS = {
    "safe":     {"label": "Safe",     "color": "green",  "desc": "Your score is well above cutoff"},
    "moderate": {"label": "Moderate", "color": "yellow", "desc": "Your score is close to cutoff"},
    "reach":    {"label": "Reach",    "color": "orange", "desc": "Your score is slightly below cutoff"},
    "unlikely": {"label": "Unlikely", "color": "red",    "desc": "Your score is significantly below cutoff"},
}

def classify_chance(user_score: float, predicted_cutoff: float) -> dict:
    """Return chance classification based on score gap."""
    gap = user_score - predicted_cutoff
    if   gap >= 5:    return {**CHANCE_LABELS["safe"],     "gap": round(gap, 2)}
    elif gap >= 0:    return {**CHANCE_LABELS["moderate"], "gap": round(gap, 2)}
    elif gap >= -3:   return {**CHANCE_LABELS["reach"],    "gap": round(gap, 2)}
    else:             return {**CHANCE_LABELS["unlikely"], "gap": round(gap, 2)}


def predict_colleges(
    user_score: float,
    category: str,
    seat_type: str,
    branch_names: list[str] | None = None,
    include_reach: bool = True,
    top_n: int = 50,
) -> list[dict]:
    """
    Main prediction function.
    Returns list of colleges the user can get into, ranked by chance.
    """
    df = get_predictions_df()

    # Filter by category and seat type
    mask = (df["Category"] == category) & (df["Seat Type"] == seat_type)
    filtered = df[mask].copy()

    if filtered.empty:
        # Fallback: try category group
        cat_group = category_to_group(category)
        filtered = df[
            (df["Category_Group"] == cat_group) & (df["Seat Type"] == seat_type)
        ].copy()

    # Filter by branches if specified
    if branch_names:
        filtered = filtered[filtered["Branch Name"].isin(branch_names)]

    if filtered.empty:
        return []

    # Cutoff: drop where cutoff > user_score + 3 (too far above)
    if not include_reach:
        filtered = filtered[filtered["predicted_2025"] <= user_score]
    else:
        filtered = filtered[filtered["predicted_2025"] <= user_score + 3]

    # Build result
    results = []
    for _, row in filtered.iterrows():
        cutoff = round(float(row["predicted_2025"]), 4)
        chance = classify_chance(user_score, cutoff)
        results.append({
            "college_id":          int(row["College ID"]),
            "college_name":        row["College Name"],
            "branch_id":           str(row["Branch ID"]),
            "branch_name":         row["Branch Name"],
            "seat_type":           row["Seat Type"],
            "category":            row["Category"],
            "status":              row["Status"],
            "is_state_level":      bool(row["Is State Level"]),
            "predicted_cutoff_2025": cutoff,
            "score_2022":          round(float(row["score_2022"]), 4) if pd.notna(row["score_2022"]) else None,
            "score_2023":          round(float(row["score_2023"]), 4) if pd.notna(row["score_2023"]) else None,
            "score_2024":          round(float(row["score_2024"]), 4) if pd.notna(row["score_2024"]) else None,
            "chance":              chance,
        })

    # Sort: safe first, then by predicted_cutoff descending (harder colleges first)
    chance_order = {"safe": 0, "moderate": 1, "reach": 2, "unlikely": 3}
    results.sort(key=lambda x: (chance_order[x["chance"]["label"].lower()], -x["predicted_cutoff_2025"]))

    return results[:top_n]


def get_college_history(college_id: int, branch_id: str | None = None) -> list[dict]:
    """Return historical + predicted cutoffs for a college."""
    df = get_predictions_df()
    mask = df["College ID"] == college_id
    if branch_id:
        mask &= df["Branch ID"].astype(str) == str(branch_id)
    rows = df[mask].copy()
    results = []
    for _, row in rows.iterrows():
        results.append({
            "college_id":    int(row["College ID"]),
            "college_name":  row["College Name"],
            "branch_name":   row["Branch Name"],
            "category":      row["Category"],
            "seat_type":     row["Seat Type"],
            "history": {
                "2022": round(float(row["score_2022"]), 4) if pd.notna(row["score_2022"]) else None,
                "2023": round(float(row["score_2023"]), 4) if pd.notna(row["score_2023"]) else None,
                "2024": round(float(row["score_2024"]), 4) if pd.notna(row["score_2024"]) else None,
                "2025_predicted": round(float(row["predicted_2025"]), 4),
            }
        })
    return results


def get_chances(college_id: int, branch_id: str, category: str, seat_type: str, user_score: float) -> dict:
    """Get admission chance for a specific college+branch combo."""
    df = get_predictions_df()
    row = df[
        (df["College ID"] == college_id) &
        (df["Branch ID"].astype(str) == str(branch_id)) &
        (df["Category"] == category) &
        (df["Seat Type"] == seat_type)
    ]
    if row.empty:
        return {"error": "No data found for this combination"}
    row = row.iloc[0]
    cutoff = round(float(row["predicted_2025"]), 4)
    return {
        "college_name":   row["College Name"],
        "branch_name":    row["Branch Name"],
        "user_score":     user_score,
        "cutoff_2025":    cutoff,
        "chance":         classify_chance(user_score, cutoff),
        "history": {
            "2022": round(float(row["score_2022"]), 4) if pd.notna(row["score_2022"]) else None,
            "2023": round(float(row["score_2023"]), 4) if pd.notna(row["score_2023"]) else None,
            "2024": round(float(row["score_2024"]), 4) if pd.notna(row["score_2024"]) else None,
        }
    }


def category_to_group(category: str) -> str:
    MAP = {
        "GOPENS":"OPEN","LOPENS":"OPEN","DEFOPENS":"OPEN",
        "GSCS":"SC","LSCS":"SC",
        "GSTS":"ST","LSTS":"ST",
        "GOBCS":"OBC","LOBCS":"OBC",
        "GNT1S":"NT1","LNT1S":"NT1",
        "GNT2S":"NT2","LNT2S":"NT2",
        "GNT3S":"NT3","LNT3S":"NT3",
        "GVJS":"VJ","LVJS":"VJ",
        "EWS":"EWS","LEWS":"EWS",
        "TFWS":"TFWS",
    }
    return MAP.get(category, "OTHER")
