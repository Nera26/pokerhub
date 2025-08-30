#!/usr/bin/env bash
set -euo pipefail

: "${PG_INSTANCE_ID?Must set PG_INSTANCE_ID}"
: "${SECONDARY_REGION?Must set SECONDARY_REGION}"
: "${PROJECT_ID?Must set PROJECT_ID}"

log() { echo "[$(date --iso-8601=seconds)] $*"; }

snap="hourly-$(date +%s)"
log "Creating Cloud SQL backup $snap"
gcloud sql backups create \
  --instance "$PG_INSTANCE_ID" \
  --project "$PROJECT_ID" >/dev/null

log "Copying backup to $SECONDARY_REGION (placeholder)"
# gcloud sql backups copy not available; implement via API or export if needed

log "Hourly backup completed"

