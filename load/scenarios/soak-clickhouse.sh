#!/bin/bash
set -euo pipefail

BASE_URL="${BASE_URL:-https://staging.pokerhub}"

docker run --rm -v "$PWD":/work -w /work \
  -e BASE_URL="$BASE_URL" \
  -e CLICKHOUSE_DSN="$CLICKHOUSE_DSN" \
  ghcr.io/grafana/xk6-output-clickhouse:latest run infra/tests/soak/k6-soak.js \
  --summary-export=soak-summary.json \
  --out json=soak-metrics.json \
  --out xk6-clickhouse="$CLICKHOUSE_DSN"

