#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"
METRICS_DIR="$SCRIPT_DIR/metrics"
mkdir -p "$METRICS_DIR"

SOCKETS=${SOCKETS:-80000}
TABLES=${TABLES:-10000}
RNG_SEED=${RNG_SEED:-1}

# record seed for replay
echo "$RNG_SEED" > "$METRICS_DIR/seed.txt"

# start GC/heap collector
METRICS_URL=${METRICS_URL:-http://localhost:4000/metrics}
OUT_FILE="$METRICS_DIR/gc-heap.log"
INTERVAL=${INTERVAL:-5}
METRICS_URL="$METRICS_URL" OUT_FILE="$OUT_FILE" INTERVAL="$INTERVAL" "$SCRIPT_DIR/collect-gc-heap.sh" &
GC_PID=$!
trap 'kill $GC_PID >/dev/null 2>&1 || true' EXIT

# run k6 scenario
SOCKETS="$SOCKETS" TABLES="$TABLES" RNG_SEED="$RNG_SEED" \
  k6 run "$SCRIPT_DIR/k6-10k-tables.js" \
  --summary-export="$METRICS_DIR/k6-summary.json" \
  --out json="$METRICS_DIR/k6-metrics.json"

# run Artillery scenario
RNG_SEED="$RNG_SEED" artillery run "$SCRIPT_DIR/artillery-10k-tables.yml" \
  -o "$METRICS_DIR/artillery-report.json"

# extract latency histogram if jq available
if command -v jq >/dev/null 2>&1; then
  jq '.aggregate.latency' "$METRICS_DIR/artillery-report.json" > "$METRICS_DIR/artillery-latency.json" || true
fi

echo "Metrics written to $METRICS_DIR"
