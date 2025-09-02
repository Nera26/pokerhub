#!/usr/bin/env bash
set -euo pipefail

URL=${METRICS_URL:-}
THRESHOLD=${ERROR_RATE_THRESHOLD:-}
TOKEN=${ADMIN_TOKEN:-}

if [[ -z "$URL" || -z "$THRESHOLD" || -z "$TOKEN" ]]; then
  echo "METRICS_URL, ERROR_RATE_THRESHOLD and ADMIN_TOKEN must be set"
  exit 1
fi

echo "Fetching metrics from $URL..."
CURRENT=$(curl -fsS -H "Authorization: Bearer $TOKEN" "$URL")

echo "Current error rate: $CURRENT (threshold: $THRESHOLD)"
awk -v current="$CURRENT" -v threshold="$THRESHOLD" 'BEGIN {exit !(current <= threshold)}' && \
  echo "Metrics within threshold" || (echo "Metrics exceed threshold" && exit 1)
