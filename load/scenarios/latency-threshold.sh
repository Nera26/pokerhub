#!/bin/bash
set -euo pipefail

ACK_P95_MS=120 ACK_P99_MS=200 SOCKETS=100 TABLES=100 DURATION=1m \
  k6 run load/k6-10k-tables.js \
  --summary-export=summary.json \
  --summary-trend-stats="avg,med,min,max,p(95),p(99)" \
  --out json=metrics.json
./load/check-thresholds.sh summary.json

