#!/usr/bin/env bash
# Loads alert rules into Alertmanager via the HTTP API.
set -euo pipefail

: "${ALERTMANAGER_URL?ALERTMANAGER_URL must be set}"

curl -sS -X POST \
  -H "Content-Type: application/yaml" \
  --data-binary @alerts.yml \
  "$ALERTMANAGER_URL/api/v1/alerts" >/dev/null

echo "Alert rules provisioned."
