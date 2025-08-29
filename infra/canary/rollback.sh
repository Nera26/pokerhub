#!/usr/bin/env bash
set -euo pipefail

# Manual override to skip SLO checks
if [[ "${SKIP_BURN_CHECK:-false}" == "true" ]]; then
  echo "SKIP_BURN_CHECK enabled - skipping burn rate verification."
  exit 0
fi

PROM_URL="${PROM_URL:-http://prometheus.monitoring.svc.cluster.local}"
ONE_HOUR_QUERY="${ONE_HOUR_QUERY:-slo_error_budget_burn_rate{window=\"1h\"}}"
SIX_HOUR_QUERY="${SIX_HOUR_QUERY:-slo_error_budget_burn_rate{window=\"6h\"}}"
ONE_HOUR_THRESHOLD="${ONE_HOUR_THRESHOLD:-2}"
SIX_HOUR_THRESHOLD="${SIX_HOUR_THRESHOLD:-1}"

fetch() {
  local query="$1"
  curl -s "${PROM_URL}/api/v1/query" --data-urlencode "query=${query}" |
    jq -r '.data.result[0].value[1] // 0'
}

one_hour=$(fetch "$ONE_HOUR_QUERY")
six_hour=$(fetch "$SIX_HOUR_QUERY")

echo "1h burn rate: ${one_hour} (threshold ${ONE_HOUR_THRESHOLD})"
echo "6h burn rate: ${six_hour} (threshold ${SIX_HOUR_THRESHOLD})"

breach=0
if (( $(echo "$one_hour > $ONE_HOUR_THRESHOLD" | bc -l) )); then
  echo "1h burn rate breach detected" >&2
  breach=1
fi
if (( $(echo "$six_hour > $SIX_HOUR_THRESHOLD" | bc -l) )); then
  echo "6h burn rate breach detected" >&2
  breach=1
fi

if [[ $breach -eq 1 ]]; then
  echo "SLO burn rate too high - initiating rollback" >&2
  exit 1
fi

echo "SLO burn rates within limits"
