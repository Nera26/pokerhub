#!/usr/bin/env bash
# Loads Grafana dashboards in this directory via the HTTP API.
set -euo pipefail

: "${GRAFANA_URL?GRAFANA_URL must be set}"
: "${GRAFANA_API_KEY?GRAFANA_API_KEY must be set}"

for dashboard in *-dashboard.json; do
  [ -f "$dashboard" ] || continue
  echo "Uploading $dashboard"
  curl -sS -X POST \
    -H "Authorization: Bearer $GRAFANA_API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"dashboard\": $(cat "$dashboard"), \"overwrite\": true}" \
    "$GRAFANA_URL/api/dashboards/db" >/dev/null
done

echo "Dashboards provisioned."
