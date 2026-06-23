#!/usr/bin/env python3
"""
scripts/run_pipeline.py
Runs all 3 data + training phases in order.
Run this ONCE before starting the API.

Usage:
    python scripts/run_pipeline.py
"""

import subprocess
import sys
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(BASE)

steps = [
    ("Phase 1 — Merge & clean data",       [sys.executable, "phase1_data_prep/merge_and_clean.py"]),
    ("Phase 2 — Build features",           [sys.executable, "phase2_features/build_features.py"]),
    ("Phase 3 — Train model & predict",    [sys.executable, "phase3_model/train.py"]),
]

print("=" * 60)
print("  MHT CET College Predictor — Full Pipeline")
print("=" * 60)

for i, (label, cmd) in enumerate(steps, 1):
    print(f"\n[{i}/{len(steps)}] {label}")
    print("-" * 40)
    result = subprocess.run(cmd, cwd=BASE)
    if result.returncode != 0:
        print(f"\n❌ Step {i} failed. Fix errors above and re-run.")
        sys.exit(1)

print("\n" + "=" * 60)
print("✅ Pipeline complete! Start the API with:")
print("   uvicorn api.main:app --reload --host 0.0.0.0 --port 8000")
print("=" * 60)
