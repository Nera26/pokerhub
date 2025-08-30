#!/usr/bin/env bash
set -euo pipefail

: "${PG_INSTANCE_ID:?Must set PG_INSTANCE_ID}"
: "${SECONDARY_REGION:?Must set SECONDARY_REGION}"

log() { echo "[$(date --iso-8601=seconds)] $*"; }

snap="hourly-$(date +%s)"
log "Creating Postgres backup $snap"
gcloud sql backups create --instance "$PG_INSTANCE_ID" --description "$snap" >/dev/null

log "Copying backup to $SECONDARY_REGION"
gcloud sql backups copy "$snap" --instance "$PG_INSTANCE_ID" --destination-region "$SECONDARY_REGION" --target-backup "${snap}-copy" >/dev/null

log "Hourly snapshot completed"

