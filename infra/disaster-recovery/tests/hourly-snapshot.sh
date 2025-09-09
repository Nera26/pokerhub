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

log "Copying backup to $SECONDARY_REGION"
if gcloud sql backups copy "$snap" \
  --instance "$PG_INSTANCE_ID" \
  --project "$PROJECT_ID" \
  --destination-region "$SECONDARY_REGION" >/dev/null; then
  log "Backup $snap copied to $SECONDARY_REGION"
else
  status=$?
  log "Failed to copy backup $snap to $SECONDARY_REGION (exit $status)"
  exit $status
fi

log "Hourly backup completed"

