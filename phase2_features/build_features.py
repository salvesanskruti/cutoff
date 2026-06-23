"""
Phase 2 - Feature Engineering
Run: python phase2_features/build_features.py
Input:  data/processed/merged_stageII.csv
Output: data/processed/features.csv
        data/processed/label_encoders.pkl
"""

import pandas as pd
import numpy as np
import pickle
import os
from sklearn.preprocessing import LabelEncoder

IN_FILE  = "data/processed/merged_stageII.csv"
OUT_DIR  = "data/processed"

def main():
    df = pd.read_csv(IN_FILE)

    # --- Group key: one unique combo = one training row ---
    GROUP_KEYS = [
        "College ID", "College Name",
        "Branch ID",  "Branch Name",
        "Seat Type",  "Category",  "Category_Group",
        "Status",     "Is State Level",
    ]

    # Pivot: one row per group, columns = score per year
    pivot = df.pivot_table(
        index=GROUP_KEYS,
        columns="Year",
        values="Score / Percentile",
        aggfunc="max"   # take the highest cutoff (most competitive)
    ).reset_index()

    pivot.columns.name = None
    pivot.rename(columns={2022: "score_2022", 2023: "score_2023", 2024: "score_2024"}, inplace=True)

    # Drop rows missing any year (can't learn trend without all 3 years)
    pivot = pivot.dropna(subset=["score_2022", "score_2023", "score_2024"])

    # --- Trend features ---
    pivot["delta_22_23"]    = pivot["score_2023"] - pivot["score_2022"]
    pivot["delta_23_24"]    = pivot["score_2024"] - pivot["score_2023"]
    pivot["avg_delta"]      = (pivot["delta_22_23"] + pivot["delta_23_24"]) / 2
    pivot["trend_slope"]    = pivot["delta_23_24"] - pivot["delta_22_23"]  # acceleration
    pivot["score_3yr_mean"] = pivot[["score_2022","score_2023","score_2024"]].mean(axis=1)
    pivot["score_3yr_std"]  = pivot[["score_2022","score_2023","score_2024"]].std(axis=1)

    # --- Encode categoricals ---
    encoders = {}
    cat_cols = ["Branch Name", "Seat Type", "Category", "Category_Group", "Status"]
    for col in cat_cols:
        le = LabelEncoder()
        pivot[f"{col}_enc"] = le.fit_transform(pivot[col].astype(str))
        encoders[col] = le

    # Save encoders
    with open(f"{OUT_DIR}/label_encoders.pkl", "wb") as f:
        pickle.dump(encoders, f)

    # Save features
    pivot.to_csv(f"{OUT_DIR}/features.csv", index=False)
    print(f"Features saved: {len(pivot)} rows, {len(pivot.columns)} columns")
    print(f"\nFeature columns:\n{list(pivot.columns)}")

    # Save unique lookup lists for API filter endpoints
    branches = sorted(df["Branch Name"].dropna().unique().tolist())
    categories = sorted(df["Category"].dropna().unique().tolist())
    cat_groups = sorted(df["Category_Group"].dropna().unique().tolist())
    seat_types = sorted(df["Seat Type"].dropna().unique().tolist())
    colleges = df[["College ID","College Name","Status","Is State Level"]].drop_duplicates().to_dict("records")

    lookup = {
        "branches": branches,
        "categories": categories,
        "category_groups": cat_groups,
        "seat_types": seat_types,
        "colleges": colleges,
    }
    with open(f"{OUT_DIR}/lookup_data.pkl", "wb") as f:
        pickle.dump(lookup, f)
    print(f"\nLookup data saved: {len(branches)} branches, {len(categories)} categories")

if __name__ == "__main__":
    main()
