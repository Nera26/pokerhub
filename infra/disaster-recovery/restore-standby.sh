#!/usr/bin/env bash
set -euo pipefail

: "${PROJECT_ID?Must set PROJECT_ID}"
: "${SECONDARY_REGION?Must set SECONDARY_REGION}"
: "${PG_BACKUP_ID?Must set PG_BACKUP_ID}"

PROMOTE="${PROMOTE:-false}"
STANDBY_IDENTIFIER="${STANDBY_IDENTIFIER:-standby-$PG_BACKUP_ID}"

log() {
  echo "[$(date --iso-8601=seconds)] $*"
}

log "Restoring backup $PG_BACKUP_ID to $SECONDARY_REGION as $STANDBY_IDENTIFIER..."
gcloud sql instances create "$STANDBY_IDENTIFIER" \
  --project "$PROJECT_ID" \
  --region "$SECONDARY_REGION" \
  --database-version=POSTGRES_14 \
  --cpu=1 --memory=3840MiB \
  --no-assign-ip >/dev/null

gcloud beta sql backups restore "$PG_BACKUP_ID" \
  --restore-instance-name "$STANDBY_IDENTIFIER" \
  --project "$PROJECT_ID" >/dev/null

gcloud sql operations wait $(gcloud sql operations list \
  --instance "$STANDBY_IDENTIFIER" \
  --project "$PROJECT_ID" \
  --limit 1 \
  --format "value(name)") \
  --project "$PROJECT_ID" >/dev/null

if [ "$PROMOTE" = "true" ]; then
  log "Instance $STANDBY_IDENTIFIER restored and ready; no promotion required in Cloud SQL"
else
  log "Backup restored as $STANDBY_IDENTIFIER in standby mode"
fi
