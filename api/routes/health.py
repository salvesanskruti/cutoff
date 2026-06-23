"""GET /api/health"""
from fastapi import APIRouter
import json
import os

# Get the absolute path to the project root
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(PROJECT_ROOT, "data", "processed")

router = APIRouter()

@router.get("/health")
def health_check():
    metrics_path = os.path.join(DATA_DIR, "model_metrics.json")
    model_path = os.path.join(DATA_DIR, "model.pkl")
    predictions_path = os.path.join(DATA_DIR, "predictions_2025.csv")
    
    metrics = {}
    if os.path.exists(metrics_path):
        with open(metrics_path) as f:
            metrics = json.load(f)
    
    return {
        "status": "ok",
        "model_loaded": os.path.exists(model_path),
        "predictions_ready": os.path.exists(predictions_path),
        "model_metrics": metrics,
    }
