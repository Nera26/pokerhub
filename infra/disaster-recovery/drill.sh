#!/usr/bin/env bash
set -euo pipefail

: "${PG_INSTANCE_ID?Must set PG_INSTANCE_ID}"
: "${SECONDARY_REGION?Must set SECONDARY_REGION}"
: "${PROJECT_ID?Must set PROJECT_ID}"
: "${PGUSER?Must set PGUSER}"
: "${PGPASSWORD?Must set PGPASSWORD}"
: "${PGDATABASE:=postgres}"
: "${WAL_ARCHIVE_BUCKET?Must set WAL_ARCHIVE_BUCKET}"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud CLI not found. Install the Google Cloud SDK and authenticate before running this drill." >&2
  exit 1
fi

log() {
  echo "[$(date --iso-8601=seconds)] $*"
}

metrics_file="drill.metrics"
: > "$metrics_file"

start_iso=$(date --iso-8601=seconds)
start_epoch=$(date +%s)

echo "START_TIME=$start_iso" >> "$metrics_file"

log "Finding latest backup for $PG_INSTANCE_ID in $SECONDARY_REGION..."
read latest_backup snap_ts < <(gcloud sql backups list \
  --instance "$PG_INSTANCE_ID" \
  --project "$PROJECT_ID" \
  --sort-by "~endTime" \
  --limit 1 \
  --format "value(id,endTime)")

snap_epoch=$(date -d "$snap_ts" +%s)
rpo_snapshot=$((start_epoch - snap_epoch))
log "Latest backup $latest_backup from $snap_ts (snapshot RPO ${rpo_snapshot}s)"

latest_wal=$(gsutil ls "gs://${WAL_ARCHIVE_BUCKET}/" | sort | tail -n1)
wal_ts=$(gsutil stat "$latest_wal" | awk -F': +' '/Creation time/ {print $2}')
wal_epoch=$(date -d "$wal_ts" +%s)
rpo_wal=$((start_epoch - wal_epoch))
log "Latest WAL $(basename "$latest_wal") from $wal_ts (wal RPO ${rpo_wal}s)"

echo "RPO_SNAPSHOT_SECONDS=$rpo_snapshot" >> "$metrics_file"
echo "RPO_WAL_SECONDS=$rpo_wal" >> "$metrics_file"
echo "RPO_SECONDS=$rpo_wal" >> "$metrics_file"

db_identifier="drill-$start_epoch"
echo "DB_IDENTIFIER=$db_identifier" >> "$metrics_file"

status=0
if [ $rpo_snapshot -gt 300 ] || [ $rpo_wal -gt 300 ]; then
  log "RPO exceeds threshold (snapshot ${rpo_snapshot}s, wal ${rpo_wal}s)"
  status=1
fi

log "Restoring backup $latest_backup to $db_identifier via standby script..."
PG_BACKUP_ID="$latest_backup" STANDBY_IDENTIFIER="$db_identifier" PROMOTE=true \
  bash "$(dirname "$0")/restore-standby.sh"

endpoint=$(gcloud sql instances describe "$db_identifier" \
  --project "$PROJECT_ID" \
  --format "value(ipAddresses[0].ipAddress)")
echo "DB_ENDPOINT=$endpoint" >> "$metrics_file"

log "Running smoke query on $endpoint..."
PGHOST="$endpoint" PGPORT=5432 psql \
  --username "$PGUSER" \
  --dbname "$PGDATABASE" \
  -c "SELECT NOW();" >/dev/null

end_iso=$(date --iso-8601=seconds)
end_epoch=$(date +%s)
rto=$((end_epoch - start_epoch))
log "Restore completed in ${rto}s"

echo "END_TIME=$end_iso" >> "$metrics_file"
echo "RTO_SECONDS=$rto" >> "$metrics_file"

if [ $rto -gt 1800 ]; then
  log "RTO exceeds threshold (${rto}s)"
  status=1
fi
if [ "${KEEP_INSTANCE:-false}" != "true" ]; then
  gcloud sql instances delete "$db_identifier" \
    --project "$PROJECT_ID" \
    --quiet || true
fi

log "Disaster recovery drill finished: RTO ${rto}s, snapshot RPO ${rpo_snapshot}s, wal RPO ${rpo_wal}s"

exit $status
