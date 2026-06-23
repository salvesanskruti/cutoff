"""
Phase 1 - Data Preparation
Run: python phase1_data_prep/merge_and_clean.py
Output: data/processed/merged_clean.csv
"""

import pandas as pd
import os

RAW_DIR = "data/raw"
OUT_DIR = "data/processed"
os.makedirs(OUT_DIR, exist_ok=True)

CATEGORY_MAP = {
    # Open
    "GOPENS": "OPEN", "LOPENS": "OPEN", "DEFOPENS": "OPEN", "PWDOPENS": "OPEN",
    "DEFROPENS": "OPEN", "PWDROPENS": "OPEN",
    # SC
    "GSCS": "SC", "LSCS": "SC", "DEFSCS": "SC", "PWDSCS": "SC",
    "DEFRSCS": "SC", "PWDRSCS": "SC",
    # ST
    "GSTS": "ST", "LSTS": "ST", "DEFSTS": "ST", "PWDSTS": "ST",
    "DEFRSTS": "ST", "PWDRSTS": "ST",
    # OBC
    "GOBCS": "OBC", "LOBCS": "OBC", "DEFOBCS": "OBC", "PWDOBCS": "OBC",
    "DEFROBCS": "OBC", "PWDROBCS": "OBC",
    # NT1
    "GNT1S": "NT1", "LNT1S": "NT1",
    # NT2
    "GNT2S": "NT2", "LNT2S": "NT2",
    # NT3
    "GNT3S": "NT3", "LNT3S": "NT3",
    # VJ
    "GVJS": "VJ", "LVJS": "VJ",
    # EWS
    "EWS": "EWS", "LEWS": "EWS",
    # TFWS (Tuition Fee Waiver)
    "TFWS": "TFWS",
    # SEBC
    "GSEBCS": "SEBC", "LSEBCS": "SEBC", "GSEBCH": "SEBC", "LSEBCH": "SEBC",
    "GSEBCO": "SEBC", "LSEBCO": "SEBC", "PWDSEBCS": "SEBC", "PWDRSEBCH": "SEBC",
    "DEFSEBCS": "SEBC", "DEFRSEBCS": "SEBC",
}

def load_year(year):
    df = pd.read_excel(f"{RAW_DIR}/{year}.xlsx")
    df["Year"] = year
    df.rename(columns={"cutoff merit no": "Cutoff Merit No"}, inplace=True)
    if "Stage" not in df.columns:
        df["Stage"] = "II"   # 2022 had no stage col - treat as Stage II
    df["Stage"] = df["Stage"].fillna("II").astype(str).str.strip()
    return df

def main():
    dfs = [load_year(y) for y in [2022, 2023, 2024]]
    df = pd.concat(dfs, ignore_index=True)

    # Normalize column names
    df.columns = [c.strip() for c in df.columns]

    # Drop rows with no score
    df = df.dropna(subset=["Score / Percentile"])

    # Clip scores to 0-100
    df["Score / Percentile"] = df["Score / Percentile"].clip(0, 100)

    # Add simplified category group
    df["Category_Group"] = df["Category"].map(CATEGORY_MAP).fillna("OTHER")

    # Determine seat level: G = State, L = Home University
    df["Seat_Level"] = df["Category"].apply(
        lambda x: "Home_University" if str(x).startswith("L") else "State"
    )

    # Keep only Stage II for main prediction (most important round)
    df_stageII = df[df["Stage"].isin(["II", "I"])].copy()

    # Save full merged
    df.to_csv(f"{OUT_DIR}/merged_clean.csv", index=False)
    print(f"Saved merged_clean.csv: {len(df)} rows")

    # Save Stage II only (used for training)
    df_stageII.to_csv(f"{OUT_DIR}/merged_stageII.csv", index=False)
    print(f"Saved merged_stageII.csv: {len(df_stageII)} rows")

    # Print summary
    print(f"\nUnique colleges: {df['College ID'].nunique()}")
    print(f"Unique branches: {df['Branch Name'].nunique()}")
    print(f"Unique categories: {df['Category'].nunique()}")
    print(f"Years: {sorted(df['Year'].unique())}")

if __name__ == "__main__":
    main()
