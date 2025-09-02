#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Defaults
TABLES=${TABLES:-10000}
SOCKETS=${SOCKETS:-80000}
RNG_SEED=${RNG_SEED:-1}
PACKET_LOSS=${PACKET_LOSS:-0.05}
JITTER_MS=${JITTER_MS:-200}

RUN_ID="$(date +%Y%m%d-%H%M%S)"
METRICS_ROOT="$SCRIPT_DIR/metrics"
METRICS_DIR="$METRICS_ROOT/$RUN_ID"
mkdir -p "$METRICS_DIR"
ln -sfn "$METRICS_DIR" "$METRICS_ROOT/latest"

# Start GC/RSS collector
METRICS_URL=${METRICS_URL:-http://localhost:4000/metrics}
OUT_FILE="$METRICS_DIR/gc-rss.log"
RSS_HIST_FILE="$METRICS_DIR/rss-histogram.json"
GC_HIST_FILE="$METRICS_DIR/gc-histogram.json"
STATS_FILE="$METRICS_DIR/gc-rss-stats.json"
INTERVAL=${INTERVAL:-60}
METRICS_URL="$METRICS_URL" OUT_FILE="$OUT_FILE" INTERVAL="$INTERVAL" \
RSS_HIST_FILE="$RSS_HIST_FILE" GC_HIST_FILE="$GC_HIST_FILE" STATS_FILE="$STATS_FILE" \
  "$SCRIPT_DIR/collect-gc-heap.sh" &
GC_PID=$!
trap 'kill $GC_PID >/dev/null 2>&1 || true' EXIT

# Run 24h soak scenario
SOCKETS="$SOCKETS" TABLES="$TABLES" RNG_SEED="$RNG_SEED" \
PACKET_LOSS="$PACKET_LOSS" JITTER_MS="$JITTER_MS" METRICS_URL="$METRICS_URL" \
  k6 run "$SCRIPT_DIR/k6-ws-soak.js" \
  --summary-export="$METRICS_DIR/k6-summary.json" \
  --out json="$METRICS_DIR/k6-metrics.json"

# Move histograms produced by k6
mv "$SCRIPT_DIR/metrics/latency-histogram.json" "$METRICS_DIR/latency-histogram.json" 2>/dev/null || true
mv "$SCRIPT_DIR/metrics/cpu-histogram.json" "$METRICS_DIR/cpu-histogram.json" 2>/dev/null || true
mv "$SCRIPT_DIR/metrics/heap-histogram.json" "$METRICS_DIR/heap-histogram.json" 2>/dev/null || true
mv "$SCRIPT_DIR/metrics/gc-histogram.json" "$METRICS_DIR/gc-histogram.json" 2>/dev/null || true

# Stop collector and propagate failure
kill $GC_PID >/dev/null 2>&1 || true
wait $GC_PID

echo "Metrics written to $METRICS_DIR"
