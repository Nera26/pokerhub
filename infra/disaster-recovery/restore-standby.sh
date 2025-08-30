#!/usr/bin/env bash
set -euo pipefail

: "${SECONDARY_REGION:?Must set SECONDARY_REGION}"
: "${PG_BACKUP_ID:?Must set PG_BACKUP_ID}"

PROMOTE="${PROMOTE:-false}"
STANDBY_IDENTIFIER="${STANDBY_IDENTIFIER:-standby-$PG_BACKUP_ID}"

log() {
  echo "[$(date --iso-8601=seconds)] $*"
}

log "Restoring backup $PG_BACKUP_ID to $SECONDARY_REGION as $STANDBY_IDENTIFIER..."
gcloud sql backups restore "$PG_BACKUP_ID" \
  --restore-instance="$STANDBY_IDENTIFIER" \
  --region "$SECONDARY_REGION" \
  --quiet

if [ "$PROMOTE" = "true" ]; then
  log "Promoting $STANDBY_IDENTIFIER to primary in $SECONDARY_REGION..."
  gcloud sql instances promote-replica "$STANDBY_IDENTIFIER"
  log "Promotion requested for $STANDBY_IDENTIFIER"
else
  log "Backup restored as $STANDBY_IDENTIFIER in standby mode"
fi
