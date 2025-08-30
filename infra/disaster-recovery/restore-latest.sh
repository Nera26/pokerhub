#!/usr/bin/env bash
# Restores the latest Cloud SQL backup into a temporary instance and checks RTO/RPO.
set -euo pipefail

: "${PG_PRIMARY_ID:?Must set PG_PRIMARY_ID}"
: "${SECONDARY_REGION:?Must set SECONDARY_REGION}"
: "${PROJECT_ID:?Must set PROJECT_ID}"
: "${PGUSER:?Must set PGUSER}"
: "${PGPASSWORD:?Must set PGPASSWORD}"
: "${PGDATABASE:=postgres}"

log() {
  echo "[$(date --iso-8601=seconds)] $*"
}

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
metrics_file="$script_dir/restore-latest.metrics"
: > "$metrics_file"

start_iso=$(date --iso-8601=seconds)
start_epoch=$(date +%s)

echo "START_TIME=$start_iso" >> "$metrics_file"

log "Finding latest backup for $PG_PRIMARY_ID in $SECONDARY_REGION..."
read latest_backup backup_ts < <(gcloud sql backups list \
  --instance="$PG_PRIMARY_ID" \
  --project="$PROJECT_ID" \
  --order-by="-endTime" \
  --limit=1 \
  --format="value(id,endTime)")

snap_epoch=$(date -d "$backup_ts" +%s)
rpo=$((start_epoch - snap_epoch))
log "Latest backup $latest_backup from $backup_ts (RPO ${rpo}s)"

echo "RPO_SECONDS=$rpo" >> "$metrics_file"

restore_id="restore-latest-$start_epoch"

cleanup() {
  log "Cleaning up $restore_id..."
  gcloud sql instances delete "$restore_id" \
    --project "$PROJECT_ID" \
    --quiet >/dev/null 2>&1 || true
}
trap cleanup EXIT

log "Restoring backup $latest_backup to $restore_id..."
gcloud sql instances create "$restore_id" \
  --project "$PROJECT_ID" \
  --region "$SECONDARY_REGION" \
  --database-version=POSTGRES_14 \
  --cpu=1 --memory=3840MiB \
  --no-assign-ip >/dev/null

gcloud beta sql backups restore "$latest_backup" \
  --restore-instance-name="$restore_id" \
  --project "$PROJECT_ID" >/dev/null

gcloud sql operations wait $(gcloud sql operations list \
  --instance="$restore_id" \
  --project="$PROJECT_ID" \
  --limit=1 \
  --format="value(name)") \
  --project "$PROJECT_ID" >/dev/null

endpoint=$(gcloud sql instances describe "$restore_id" \
  --project "$PROJECT_ID" \
  --format="value(ipAddresses[0].ipAddress)")

PGPASSWORD="$PGPASSWORD" psql -h "$endpoint" -U "$PGUSER" -d "$PGDATABASE" -c 'SELECT 1;' >/dev/null

end_iso=$(date --iso-8601=seconds)
end_epoch=$(date +%s)

rto=$((end_epoch - start_epoch))

echo "END_TIME=$end_iso" >> "$metrics_file"
echo "RTO_SECONDS=$rto" >> "$metrics_file"

if [ "$rto" -gt 1800 ]; then
  log "Restore time exceeded threshold: ${rto}s > 1800s"
  exit 1
fi
if [ "$rpo" -gt 300 ]; then
  log "Data loss window exceeded threshold: ${rpo}s > 300s"
  exit 1
fi

log "Restore completed in ${rto}s with data loss window ${rpo}s"
