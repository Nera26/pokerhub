#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

RUN_ID="$(date +%Y%m%d-%H%M%S)"
METRICS_ROOT="$SCRIPT_DIR/metrics"
METRICS_DIR="$METRICS_ROOT/$RUN_ID"
mkdir -p "$METRICS_DIR"
ln -sfn "$METRICS_DIR" "$METRICS_ROOT/latest"

PACKET_LOSS=${PACKET_LOSS:-0}
LATENCY_MS=${LATENCY_MS:-200}
JITTER_MS=${JITTER_MS:-0}
PROXY_PORT=${PROXY_PORT:-3001}
echo "$PACKET_LOSS" > "$METRICS_DIR/packet-loss.txt"
echo "$JITTER_MS" > "$METRICS_DIR/jitter-ms.txt"

# start toxiproxy for packet loss/latency/jitter
PACKET_LOSS="$PACKET_LOSS" LATENCY_MS="$LATENCY_MS" JITTER_MS="$JITTER_MS" \
  PROXY_PORT="$PROXY_PORT" "$SCRIPT_DIR/toxiproxy.sh"
trap 'toxiproxy-cli delete pokerhub_ws >/dev/null 2>&1 || true' EXIT
WS_URL="ws://localhost:${PROXY_PORT}/game"

# start GC/heap collector
METRICS_URL=${METRICS_URL:-http://localhost:4000/metrics}
HEAP_HIST_FILE="$METRICS_DIR/heap-histogram.json"
GC_HIST_FILE="$METRICS_DIR/gc-histogram.json"
OUT_FILE="$METRICS_DIR/gc-heap.log"
INTERVAL=${INTERVAL:-5}
METRICS_URL="$METRICS_URL" OUT_FILE="$OUT_FILE" INTERVAL="$INTERVAL" \
HEAP_HIST_FILE="$HEAP_HIST_FILE" GC_HIST_FILE="$GC_HIST_FILE" \
  "$SCRIPT_DIR/collect-gc-heap.sh" &
GC_PID=$!
trap 'kill $GC_PID >/dev/null 2>&1 || true' EXIT

# run k6 replay scenario
SOCKETS=${SOCKETS:-100000}
HAND_HISTORY_FILE=${HAND_HISTORY_FILE:-}
if [[ -n "$HAND_HISTORY_FILE" ]]; then
  HAND_HISTORY_FILE="$HAND_HISTORY_FILE" SOCKETS="$SOCKETS" WS_URL="$WS_URL" \
    k6 run "$SCRIPT_DIR/k6-100k-sockets-replay.js" \
    --summary-export="$METRICS_DIR/k6-summary.json" \
    --out json="$METRICS_DIR/k6-metrics.json"
else
  SOCKETS="$SOCKETS" WS_URL="$WS_URL" k6 run "$SCRIPT_DIR/k6-100k-sockets-replay.js" \
    --summary-export="$METRICS_DIR/k6-summary.json" \
    --out json="$METRICS_DIR/k6-metrics.json"
fi
mv "$SCRIPT_DIR/metrics/ack-histogram.json" "$METRICS_DIR/ack-histogram.json" 2>/dev/null || true

kill $GC_PID >/dev/null 2>&1 || true
wait $GC_PID 2>/dev/null || true

# check thresholds
"$SCRIPT_DIR/check-thresholds.sh" "$METRICS_DIR/k6-summary.json" "$GC_HIST_FILE" "$HEAP_HIST_FILE"

echo "Metrics written to $METRICS_DIR"
