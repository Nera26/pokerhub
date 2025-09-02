#!/usr/bin/env bash
set -euo pipefail

: "${PROJECT_ID?Must set PROJECT_ID}"
: "${SECONDARY_REGION?Must set SECONDARY_REGION}"
: "${PG_BACKUP_ID?Must set PG_BACKUP_ID}"

log() {
  echo "[$(date --iso-8601=seconds)] $*"
}

metrics_file="restore-backup.metrics"
: > "$metrics_file"

start_iso=$(date --iso-8601=seconds)
start_epoch=$(date +%s)

echo "START_TIME=$start_iso" >> "$metrics_file"

log "Fetching backup metadata..."
snap_ts=$(gcloud sql backups describe "$PG_BACKUP_ID" \
  --project "$PROJECT_ID" \
  --format "value(endTime)")
snap_epoch=$(date -d "$snap_ts" +%s)

rpo=$((start_epoch - snap_epoch))
log "Snapshot age ${rpo}s"
echo "RPO_SECONDS=$rpo" >> "$metrics_file"

restore_id="restore-test-$start_epoch"
log "Restoring backup $PG_BACKUP_ID to $restore_id in $SECONDARY_REGION..."
restore_start=$(date +%s)
gcloud sql instances create "$restore_id" \
  --project "$PROJECT_ID" \
  --region "$SECONDARY_REGION" \
  --database-version=POSTGRES_14 \
  --cpu=1 --memory=3840MiB \
  --no-assign-ip >/dev/null
gcloud beta sql backups restore "$PG_BACKUP_ID" \
  --restore-instance-name "$restore_id" \
  --project "$PROJECT_ID" >/dev/null
gcloud sql operations wait $(gcloud sql operations list \
  --instance "$restore_id" \
  --project "$PROJECT_ID" \
  --limit 1 \
  --format "value(name)") \
  --project "$PROJECT_ID" >/dev/null
restore_end=$(date +%s)

rto=$((restore_end - start_epoch))
log "Restore completed in ${rto}s"

end_iso=$(date --iso-8601=seconds)
echo "END_TIME=$end_iso" >> "$metrics_file"
echo "RTO_SECONDS=$rto" >> "$metrics_file"

# Cleanup
gcloud sql instances delete "$restore_id" \
  --project "$PROJECT_ID" \
  --quiet || true

log "Backup restore test completed in ${rto}s with data loss window ${rpo}s"
