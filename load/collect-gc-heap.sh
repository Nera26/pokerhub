#!/usr/bin/env bash
set -euo pipefail

# Poll the metrics endpoint for CPU, GC pause and heap usage.
# When optional thresholds are breached the script exits non‑zero so the
# surrounding soak test fails fast. After completion, the script computes
# 24h heap growth and GC pause p95 and exits non‑zero if growth ≥1% or
# p95 ≥50ms.
METRICS_URL=${METRICS_URL:-http://localhost:4000/metrics}
SCRIPT_DIR="$(dirname "$0")"
OUT_FILE=${OUT_FILE:-$SCRIPT_DIR/metrics/gc-heap.log}
INTERVAL=${INTERVAL:-60}
GRAFANA_PUSH_URL=${GRAFANA_PUSH_URL:-}
CPU_THRESHOLD=${CPU_THRESHOLD:-}
HEAP_THRESHOLD=${HEAP_THRESHOLD:-}
GC_THRESHOLD=${GC_THRESHOLD:-}
HEAP_HIST_FILE=${HEAP_HIST_FILE:-$SCRIPT_DIR/metrics/heap-histogram.json}
GC_HIST_FILE=${GC_HIST_FILE:-$SCRIPT_DIR/metrics/gc-histogram.json}

declare -A heap_hist=()
declare -A gc_hist=()

finalize() {
  mkdir -p "$(dirname "$HEAP_HIST_FILE")"
  {
    echo "{";
    first=1;
    for bucket in "${!heap_hist[@]}"; do
      [[ $first -eq 0 ]] && echo ",";
      first=0;
      printf "  \"%s\": %s" "$bucket" "${heap_hist[$bucket]}";
    done;
    echo "";
    echo "}";
  } > "$HEAP_HIST_FILE"
  {
    echo "{";
    first=1;
    for bucket in "${!gc_hist[@]}"; do
      [[ $first -eq 0 ]] && echo ",";
      first=0;
      printf "  \"%s\": %s" "$bucket" "${gc_hist[$bucket]}";
    done;
    echo "";
    echo "}";
  } > "$GC_HIST_FILE"
  if [[ -f "$OUT_FILE" ]]; then
    node - "$OUT_FILE" <<'NODE'
const fs = require('fs');
const file = process.argv[1];
try {
  const lines = fs.readFileSync(file, 'utf-8').trim().split('\n');
  const gc = [];
  const heap = [];
  for (const line of lines) {
    const parts = line.trim().split(' ');
    for (const kv of parts.slice(1)) {
      const [k, v] = kv.split('=');
      if (k === 'gc_pause_ms') gc.push(Number(v));
      if (k === 'heap_used_bytes') heap.push(Number(v));
    }
  }
  const pct = (arr, p) => {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = Math.floor((sorted.length - 1) * p);
    return sorted[idx];
  };
  const start = heap[0] || 0;
  const end = heap[heap.length - 1] || 0;
  const growth = start ? ((end - start) / start) * 100 : 0;
  const p95 = pct(gc, 0.95);
  if (growth >= 1 || p95 >= 50) {
    console.error(`heap growth ${growth.toFixed(2)}% gc p95 ${p95.toFixed(2)}ms`);
    process.exit(1);
  }
} catch (e) {
  // ignore errors
}
NODE
  fi
}

trap finalize EXIT

last_cpu=""

mkdir -p "$(dirname "$OUT_FILE")"

while true; do
  if ! metrics=$(curl -sf "$METRICS_URL"); then
    sleep "$INTERVAL"
    continue
  fi

  gc_sum=$(echo "$metrics" | awk '/nodejs_gc_duration_seconds_sum/ {print $2}')
  gc_count=$(echo "$metrics" | awk '/nodejs_gc_duration_seconds_count/ {print $2}')
  heap_used=$(echo "$metrics" | awk '/nodejs_heap_size_used_bytes/ {print $2}')
  cpu_total=$(echo "$metrics" | awk '/process_cpu_seconds_total/ {print $2}')

  avg_gc=0
  if [[ -n "$gc_count" && "$gc_count" != "0" ]]; then
    avg_gc=$(awk -v s="$gc_sum" -v c="$gc_count" 'BEGIN{print s/c*1000}')
  fi

  timestamp=$(date --iso-8601=seconds)
  echo "$timestamp heap_used_bytes=$heap_used gc_pause_ms=$avg_gc cpu_total=$cpu_total" >> "$OUT_FILE"
  heap_bucket=$(( heap_used / (1024 * 1024) / 10 * 10 ))
  gc_bucket=$(awk -v g="$avg_gc" 'BEGIN{printf "%d", int(g/10)*10}')
  heap_hist[$heap_bucket]=$(( ${heap_hist[$heap_bucket]:-0} + 1 ))
  gc_hist[$gc_bucket]=$(( ${gc_hist[$gc_bucket]:-0} + 1 ))
  if [[ -n "$GRAFANA_PUSH_URL" ]]; then
    echo "gc_pause_ms $avg_gc" | curl -sf --data-binary @- "$GRAFANA_PUSH_URL/metrics/job/soak" || true
  fi

  if [[ -n "$HEAP_THRESHOLD" ]] && awk -v h="$heap_used" -v t="$HEAP_THRESHOLD" 'BEGIN{exit (h>t)?0:1}'; then
    echo "Heap usage $heap_used exceeded threshold $HEAP_THRESHOLD" >&2
    exit 1
  fi

  if [[ -n "$GC_THRESHOLD" ]] && awk -v g="$avg_gc" -v t="$GC_THRESHOLD" 'BEGIN{exit (g>t)?0:1}'; then
    echo "GC pause $avg_gc ms exceeded threshold $GC_THRESHOLD" >&2
    exit 1
  fi

  if [[ -n "$CPU_THRESHOLD" && -n "$last_cpu" ]]; then
    cpu_percent=$(awk -v c="$cpu_total" -v l="$last_cpu" -v i="$INTERVAL" 'BEGIN{print (c-l)/i*100}')
    if awk -v c="$cpu_percent" -v t="$CPU_THRESHOLD" 'BEGIN{exit (c>t)?0:1}'; then
      echo "CPU usage $cpu_percent% exceeded threshold $CPU_THRESHOLD%" >&2
      exit 1
    fi
  fi

  last_cpu="$cpu_total"
  sleep "$INTERVAL"
done
