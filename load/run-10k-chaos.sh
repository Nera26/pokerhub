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

# stop GC collector and summarise stats
kill $GC_PID >/dev/null 2>&1 || true
wait $GC_PID 2>/dev/null || true
node - "$OUT_FILE" "$METRICS_DIR/gc-stats.json" <<'NODE'
const fs = require('fs');
const [input, output] = process.argv.slice(1);
try {
  const lines = fs.readFileSync(input, 'utf-8').trim().split('\n');
  const stats = lines.map((l) => {
    const [timestamp, ...pairs] = l.trim().split(' ');
    const obj = { timestamp };
    for (const kv of pairs) {
      const [k, v] = kv.split('=');
      obj[k] = Number(v);
    }
    return obj;
  });
  fs.writeFileSync(output, JSON.stringify(stats, null, 2));
} catch (e) {
  // ignore if log missing
}
NODE

echo "Metrics written to $METRICS_DIR"
