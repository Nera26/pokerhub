#!/usr/bin/env bash
set -euo pipefail

URL=${METRICS_URL:-}
THRESHOLD=${ERROR_RATE_THRESHOLD:-}

if [[ -z "$URL" || -z "$THRESHOLD" ]]; then
  echo "METRICS_URL and ERROR_RATE_THRESHOLD must be set"
  exit 1
fi

echo "Fetching metrics from $URL..."
CURRENT=$(curl -fsS "$URL")

echo "Current error rate: $CURRENT (threshold: $THRESHOLD)"
awk -v current="$CURRENT" -v threshold="$THRESHOLD" 'BEGIN {exit !(current <= threshold)}' && \
  echo "Metrics within threshold" || (echo "Metrics exceed threshold" && exit 1)
