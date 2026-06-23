"""
Phase 3 - Model Training
Run: python phase3_model/train.py
Input:  data/processed/features.csv
Output: data/processed/model.pkl
        data/processed/model_metrics.json
"""

import pandas as pd
import numpy as np
import pickle
import json
import os
from sklearn.model_selection import cross_val_score, KFold
from sklearn.metrics import mean_absolute_error, r2_score
from xgboost import XGBRegressor

IN_FILE  = "data/processed/features.csv"
OUT_DIR  = "data/processed"

# Features used for training
FEATURE_COLS = [
    "score_2022", "score_2023",           # historical scores (NOT score_2024 - that's target)
    "delta_22_23",                        # year 1->2 change
    "avg_delta", "trend_slope",           # trend shape
    "score_3yr_mean", "score_3yr_std",    # distribution info
    "Branch Name_enc", "Seat Type_enc",
    "Category_enc", "Category_Group_enc",
    "Is State Level",
]
TARGET_COL = "score_2024"  # predict known year first to validate, then retrain for 2025

def main():
    df = pd.read_csv(IN_FILE)

    X = df[FEATURE_COLS].copy()
    y = df[TARGET_COL].copy()

    print(f"Training on {len(df)} rows, {len(FEATURE_COLS)} features")

    # --- Cross-validation to measure model quality ---
    model_cv = XGBRegressor(
        n_estimators=500,
        learning_rate=0.05,
        max_depth=6,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        verbosity=0,
    )
    kf = KFold(n_splits=5, shuffle=True, random_state=42)
    cv_mae = -cross_val_score(model_cv, X, y, cv=kf, scoring="neg_mean_absolute_error")
    cv_r2  =  cross_val_score(model_cv, X, y, cv=kf, scoring="r2")

    print(f"\nCross-validation (5-fold):")
    print(f"  MAE  : {cv_mae.mean():.3f} ± {cv_mae.std():.3f} percentile points")
    print(f"  R²   : {cv_r2.mean():.4f} ± {cv_r2.std():.4f}")

    # --- Train final model on ALL data (for 2025 prediction) ---
    # Shift features: now use 2022+2023+2024 to predict 2025
    # Re-build features with 2024 as last known year
    df_all = pd.read_csv(IN_FILE)

    # For 2025 prediction: use score_2023 as "score_n-2", score_2024 as "score_n-1"
    X_final = df_all.copy()
    X_final["score_prev2"] = X_final["score_2022"]
    X_final["score_prev1"] = X_final["score_2023"]
    X_final["delta_prev"]  = X_final["score_2024"] - X_final["score_2023"]
    X_final["delta_2"]     = X_final["score_2023"] - X_final["score_2022"]
    X_final["avg_d"]       = (X_final["delta_prev"] + X_final["delta_2"]) / 2
    X_final["slope"]       = X_final["delta_prev"] - X_final["delta_2"]
    X_final["mean3"]       = X_final["score_3yr_mean"]
    X_final["std3"]        = X_final["score_3yr_std"]

    FINAL_FEAT_COLS = [
        "score_prev2", "score_prev1", "delta_prev", "delta_2",
        "avg_d", "slope", "mean3", "std3",
        "Branch Name_enc", "Seat Type_enc",
        "Category_enc", "Category_Group_enc",
        "Is State Level",
    ]

    model_final = XGBRegressor(
        n_estimators=500,
        learning_rate=0.05,
        max_depth=6,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        verbosity=0,
    )
    model_final.fit(X_final[FINAL_FEAT_COLS], df_all[TARGET_COL])

    # Generate 2025 predictions for ALL combos
    df_all["predicted_2025"] = model_final.predict(X_final[FINAL_FEAT_COLS]).clip(0, 100)

    # Save predictions table (used by API)
    pred_cols = [
        "College ID", "College Name", "Branch ID", "Branch Name",
        "Seat Type", "Category", "Category_Group", "Status", "Is State Level",
        "score_2022", "score_2023", "score_2024", "predicted_2025"
    ]
    df_all[pred_cols].to_csv(f"{OUT_DIR}/predictions_2025.csv", index=False)
    print(f"\nSaved predictions_2025.csv: {len(df_all)} rows")

    # Save model
    model_payload = {
        "model": model_final,
        "feature_cols": FINAL_FEAT_COLS,
    }
    with open(f"{OUT_DIR}/model.pkl", "wb") as f:
        pickle.dump(model_payload, f)

    # Save metrics
    metrics = {
        "cv_mae_mean": round(float(cv_mae.mean()), 4),
        "cv_mae_std":  round(float(cv_mae.std()),  4),
        "cv_r2_mean":  round(float(cv_r2.mean()),  4),
        "cv_r2_std":   round(float(cv_r2.std()),   4),
        "train_rows":  int(len(df)),
        "features":    FEATURE_COLS,
    }
    with open(f"{OUT_DIR}/model_metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"\nModel saved to data/processed/model.pkl")
    print(f"Metrics: MAE = {metrics['cv_mae_mean']} percentile points, R² = {metrics['cv_r2_mean']}")
    print("\n✅ Training complete. Ready for API.")

if __name__ == "__main__":
    main()
