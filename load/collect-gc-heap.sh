#!/usr/bin/env bash
set -euo pipefail

# Poll the metrics endpoint for CPU, GC pause and heap usage.
# When optional thresholds are breached the script exits non‑zero so the
# surrounding soak test fails fast.
METRICS_URL=${METRICS_URL:-http://localhost:4000/metrics}
OUT_FILE=${OUT_FILE:-gc-heap-metrics.log}
INTERVAL=${INTERVAL:-60}
GRAFANA_PUSH_URL=${GRAFANA_PUSH_URL:-}
CPU_THRESHOLD=${CPU_THRESHOLD:-}
HEAP_THRESHOLD=${HEAP_THRESHOLD:-}
GC_THRESHOLD=${GC_THRESHOLD:-}

last_cpu=""

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
  echo "$timestamp heap_used=$heap_used gc_avg_ms=$avg_gc cpu_total=$cpu_total" >> "$OUT_FILE"
  if [[ -n "$GRAFANA_PUSH_URL" ]]; then
    echo "nodejs_gc_avg_ms $avg_gc" | curl -sf --data-binary @- "$GRAFANA_PUSH_URL/metrics/job/soak" || true
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
