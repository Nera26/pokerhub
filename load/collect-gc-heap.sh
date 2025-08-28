#!/usr/bin/env bash
set -euo pipefail

# Poll the metrics endpoint for GC pause and heap usage and optionally push to Grafana.
METRICS_URL=${METRICS_URL:-http://localhost:3000/metrics}
OUT_FILE=${OUT_FILE:-gc-heap-metrics.log}
INTERVAL=${INTERVAL:-60}
GRAFANA_PUSH_URL=${GRAFANA_PUSH_URL:-}

while true; do
  if ! metrics=$(curl -sf "$METRICS_URL" | grep -E 'nodejs_gc_duration_seconds|nodejs_heap_size_(used|total)_bytes'); then
    sleep "$INTERVAL"
    continue
  fi
  echo "$(date --iso-8601=seconds) $metrics" >> "$OUT_FILE"
  if [[ -n "$GRAFANA_PUSH_URL" ]]; then
    curl -sf --data-binary "$metrics" "$GRAFANA_PUSH_URL/metrics/job/soak" || true
  fi
  sleep "$INTERVAL"
done
