#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# defaults (overridable via env/flags)
TABLES=${TABLES:-10000}
SOCKETS=${SOCKETS:-$((TABLES * 10))}
RNG_SEED=${RNG_SEED:-1}
PACKET_LOSS=${PACKET_LOSS:-0}
JITTER_MS=${JITTER_MS:-0}
REPLAY_DIR=""

# parse flags
while [[ $# -gt 0 ]]; do
  case "$1" in
    --replay)
      REPLAY_DIR="$2"
      shift 2
      ;;
    --sockets)
      SOCKETS="$2"
      shift 2
      ;;
    --packet-loss)
      PACKET_LOSS="$2"
      shift 2
      ;;
    --jitter)
      JITTER_MS="$2"
      shift 2
      ;;
    *)
      echo "Usage: $0 [--sockets N] [--packet-loss P] [--jitter MS] [--replay DIR]" >&2
      exit 1
      ;;
  esac
done

if [[ -n "$REPLAY_DIR" ]]; then
  BASE_DIR="$REPLAY_DIR"
  RNG_SEED="$(cat "$BASE_DIR/seed.txt")"
  PACKET_LOSS="$(cat "$BASE_DIR/packet-loss.txt" 2>/dev/null || echo 0)"
  JITTER_MS="$(cat "$BASE_DIR/jitter-ms.txt" 2>/dev/null || echo 0)"
  METRICS_DIR="$BASE_DIR/replay"
  mkdir -p "$METRICS_DIR"
else
  RUN_ID="$(date +%Y%m%d-%H%M%S)"
  METRICS_ROOT="$SCRIPT_DIR/metrics"
  METRICS_DIR="$METRICS_ROOT/$RUN_ID"
  mkdir -p "$METRICS_DIR"
  ln -sfn "$METRICS_DIR" "$METRICS_ROOT/latest"
fi

if (( SOCKETS > 100000 )); then
  echo "SOCKETS capped at 100000" >&2
  SOCKETS=100000
fi

if [[ -n "$REPLAY_DIR" ]]; then
  SOCKETS=${SOCKETS:-$((TABLES * 10))}
else
  # record seed and settings for replay
  echo "$RNG_SEED" > "$METRICS_DIR/seed.txt"
  echo "$PACKET_LOSS" > "$METRICS_DIR/packet-loss.txt"
  echo "$JITTER_MS" > "$METRICS_DIR/jitter-ms.txt"
fi
PROXY_PORT=${PROXY_PORT:-3001}
if [[ "$PACKET_LOSS" != "0" || "$JITTER_MS" != "0" ]]; then
  LATENCY_MS=${LATENCY_MS:-200}
  PACKET_LOSS="$PACKET_LOSS" LATENCY_MS="$LATENCY_MS" JITTER_MS="$JITTER_MS" \
    PROXY_PORT="$PROXY_PORT" "$SCRIPT_DIR/toxiproxy.sh"
  trap 'toxiproxy-cli delete pokerhub_ws >/dev/null 2>&1 || true' EXIT
  WS_URL="ws://localhost:${PROXY_PORT}/game"
else
  WS_URL="ws://localhost:4000/game"
fi

if [[ -n "$REPLAY_DIR" ]]; then
  # replay only runs k6
  SOCKETS="$SOCKETS" TABLES="$TABLES" RNG_SEED="$RNG_SEED" \
  PACKET_LOSS="$PACKET_LOSS" JITTER_MS="$JITTER_MS" WS_URL="$WS_URL" \
    k6 run "$SCRIPT_DIR/k6-10k-tables.js" \
    --summary-export="$METRICS_DIR/k6-summary.json" \
    --out json="$METRICS_DIR/k6-metrics.json"
  mv "$SCRIPT_DIR/metrics/ack-histogram.json" "$METRICS_DIR/ack-histogram.json" 2>/dev/null || true
  echo "Replay metrics written to $METRICS_DIR"
  exit 0
fi

# start GC/heap collector
METRICS_URL=${METRICS_URL:-http://localhost:4000/metrics}
OUT_FILE="$METRICS_DIR/gc-heap.log"
HEAP_HIST_FILE="$METRICS_DIR/heap-histogram.json"
GC_HIST_FILE="$METRICS_DIR/gc-histogram.json"
INTERVAL=${INTERVAL:-5}
METRICS_URL="$METRICS_URL" OUT_FILE="$OUT_FILE" INTERVAL="$INTERVAL" \
HEAP_HIST_FILE="$HEAP_HIST_FILE" GC_HIST_FILE="$GC_HIST_FILE" \
  "$SCRIPT_DIR/collect-gc-heap.sh" &
GC_PID=$!
trap 'kill $GC_PID >/dev/null 2>&1 || true' EXIT

# run k6 scenario
SOCKETS="$SOCKETS" TABLES="$TABLES" RNG_SEED="$RNG_SEED" \
PACKET_LOSS="$PACKET_LOSS" JITTER_MS="$JITTER_MS" WS_URL="$WS_URL" \
  k6 run "$SCRIPT_DIR/k6-10k-tables.js" \
  --summary-export="$METRICS_DIR/k6-summary.json" \
  --out json="$METRICS_DIR/k6-metrics.json"
mv "$SCRIPT_DIR/metrics/ack-histogram.json" "$METRICS_DIR/ack-histogram.json" 2>/dev/null || true

# build per-table latency histograms (10ms buckets)
node - "$METRICS_DIR/k6-metrics.json" "$METRICS_DIR/ack-per-table.json" "$TABLES" <<'NODE'
const fs = require('fs');
const readline = require('readline');
const [input, output, tablesStr] = process.argv.slice(1);
const tables = Number(tablesStr || 1);
const hists = {};
const rl = readline.createInterface({ input: fs.createReadStream(input) });
rl.on('line', (line) => {
  try {
    const obj = JSON.parse(line);
    if (obj.metric !== 'ack_latency') return;
    const vu = Number(obj.tags?.vu || 0);
    const table = vu % tables;
    const bucket = Math.floor(Number(obj.value) / 10) * 10;
    const hist = (hists[table] ||= {});
    hist[bucket] = (hist[bucket] || 0) + 1;
  } catch (e) {
    // ignore parse errors
  }
});
rl.on('close', () => {
  fs.writeFileSync(output, JSON.stringify(hists, null, 2));
});
NODE

# run Artillery scenario
RNG_SEED="$RNG_SEED" artillery run "$SCRIPT_DIR/artillery-10k-tables.yml" \
  -o "$METRICS_DIR/artillery-report.json"

# extract latency histogram if jq available
if command -v jq >/dev/null 2>&1; then
  jq '.aggregate.latency' "$METRICS_DIR/artillery-report.json" > "$METRICS_DIR/artillery-latency.json" || true
fi

# run 100k socket replay scenario and capture histograms
SOCKETS="$SOCKETS" TABLES="$TABLES" RNG_SEED="$RNG_SEED" \
PACKET_LOSS="$PACKET_LOSS" JITTER_MS="$JITTER_MS" WS_URL="$WS_URL" \
  k6 run "$SCRIPT_DIR/k6-100k-sockets-replay.js" \
  --summary-export="$METRICS_DIR/k6-summary.json" \
  --out json="$METRICS_DIR/k6-metrics.json"
mv "$SCRIPT_DIR/metrics/ack-histogram.json" "$METRICS_DIR/ack-histogram.json" 2>/dev/null || true
mv "$SCRIPT_DIR/metrics/gc-histogram.json" "$METRICS_DIR/gc-histogram.json" 2>/dev/null || true
mv "$SCRIPT_DIR/metrics/heap-histogram.json" "$METRICS_DIR/heap-histogram.json" 2>/dev/null || true

# stop GC collector and summarise stats
kill $GC_PID >/dev/null 2>&1 || true
wait $GC_PID 2>/dev/null || true
node - "$OUT_FILE" "$METRICS_DIR/gc-stats.json" "$METRICS_DIR/heap-stats.json" <<'NODE'
const fs = require('fs');
const [input, gcOut, heapOut] = process.argv.slice(1);
try {
  const lines = fs.readFileSync(input, 'utf-8').trim().split('\n');
  const gcVals = [];
  const heapVals = [];
  for (const line of lines) {
    const [, ...pairs] = line.trim().split(' ');
    for (const kv of pairs) {
      const [k, v] = kv.split('=');
      if (k === 'gc_avg_ms') gcVals.push(Number(v));
      if (k === 'heap_used') heapVals.push(Number(v));
    }
  }
  const pct = (arr, p) => {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
    return sorted[idx];
  };
  const gcStats = { p95: pct(gcVals, 0.95), p99: pct(gcVals, 0.99), max: Math.max(0, ...gcVals) };
  const heapStats = { p95: pct(heapVals, 0.95), p99: pct(heapVals, 0.99), max: Math.max(0, ...heapVals) };
  fs.writeFileSync(gcOut, JSON.stringify(gcStats, null, 2));
  fs.writeFileSync(heapOut, JSON.stringify(heapStats, null, 2));
} catch (e) {
  // ignore if log missing
}
NODE

"$SCRIPT_DIR/check-thresholds.sh" "$METRICS_DIR/k6-summary.json" "$GC_HIST_FILE" "$HEAP_HIST_FILE"

echo "Metrics written to $METRICS_DIR"
