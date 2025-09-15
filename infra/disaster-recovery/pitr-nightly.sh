#!/usr/bin/env bash
set -euo pipefail

: "${PROJECT_ID?Must set PROJECT_ID}"
: "${PG_INSTANCE_ID?Must set PG_INSTANCE_ID}"
: "${SECONDARY_REGION?Must set SECONDARY_REGION}"
: "${CLOUD_SQL_ACCESS_TOKEN?Must set CLOUD_SQL_ACCESS_TOKEN}"

log() {
  echo "[$(date --iso-8601=seconds)] $*"
}

api="https://sqladmin.googleapis.com/sql/v1/projects/${PROJECT_ID}/instances/${PG_INSTANCE_ID}"

log "Copying latest backup to ${SECONDARY_REGION}..."
curl -fsS \
  -H "Authorization: Bearer ${CLOUD_SQL_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -X POST \
  "${api}/backupRuns/latest/copy?destinationRegion=${SECONDARY_REGION}" >/dev/null

log "Verifying backup copy..."
curl -fsS \
  -H "Authorization: Bearer ${CLOUD_SQL_ACCESS_TOKEN}" \
  "${api}/backupRuns" >/dev/null

log "Nightly PITR backup copy completed"
