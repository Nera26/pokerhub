#!/bin/bash
set -euo pipefail

TABLES=10000 RNG_SEED="${GITHUB_RUN_ID}" ./load/run-10k-chaos.sh --sockets 80000 --packet-loss 0.05 --jitter 200
METRICS_DIR=$(ls -td load/metrics/*/ | head -n 1)
./load/check-thresholds.sh "$METRICS_DIR/k6-summary.json" | tee -a "$GITHUB_STEP_SUMMARY"
cp "$METRICS_DIR/k6-summary.json" k6-summary.json
cp "$METRICS_DIR/k6-metrics.json" k6-metrics.json
