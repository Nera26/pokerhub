#!/usr/bin/env bash
set -euo pipefail

: "${PG_INSTANCE_ID?Must set PG_INSTANCE_ID}"
: "${SECONDARY_REGION?Must set SECONDARY_REGION}"
: "${PROJECT_ID?Must set PROJECT_ID}"
: "${PGUSER?Must set PGUSER}"
: "${PGPASSWORD?Must set PGPASSWORD}"
: "${PGDATABASE:=postgres}"
: "${WAL_ARCHIVE_BUCKET?Must set WAL_ARCHIVE_BUCKET}"
: "${DR_METRICS_BUCKET?Must set DR_METRICS_BUCKET}"
: "${REPLICATION_LAG_THRESHOLD_SECONDS:=900}"

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud CLI not found. Install the Google Cloud SDK and authenticate before running this drill." >&2
  exit 1
fi
if ! command -v jq >/dev/null 2>&1; then
  echo "jq not found. Install jq before running this drill." >&2
  exit 1
fi

log() {
  echo "[$(date --iso-8601=seconds)] $*"
}

metrics_file="drill.metrics"
: > "$metrics_file"
status=0

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

check_replication_bucket() {
  local bucket="$1"
  local metric_key="$2"
  log "Checking replication for $bucket..."
  local desc
  desc=$(gcloud storage buckets describe "gs://$bucket" --format=json)
  local lag
  lag=$(echo "$desc" | jq -r '.replication?//{} | .asyncTurbo?.lagDuration // "0s"' | sed 's/s$//')
  echo "${metric_key}=${lag}" >> "$metrics_file"
  log "$bucket replication lag ${lag}s"
  if [ "${lag:-0}" -gt "$REPLICATION_LAG_THRESHOLD_SECONDS" ]; then
    log "$bucket replication lag exceeds threshold (${lag}s)"
    status=1
  fi
}

check_replication_bucket "$DR_METRICS_BUCKET" METRICS_REPLICATION_LAG_SECONDS
check_replication_bucket "$WAL_ARCHIVE_BUCKET" WAL_REPLICATION_LAG_SECONDS

log "Disabling primary instance $PG_INSTANCE_ID..."
failover_start=$(date +%s)
gcloud sql instances patch "$PG_INSTANCE_ID" --activation-policy=NEVER --quiet

restore_primary() {
  log "Re-enabling original primary $PG_INSTANCE_ID..."
  local start="$(date +%s)"
  gcloud sql instances patch "$PG_INSTANCE_ID" --activation-policy=ALWAYS --quiet || true
  until [ "$(gcloud sql instances describe "$PG_INSTANCE_ID" --project "$PROJECT_ID" --format 'value(state)')" = "RUNNABLE" ]; do
    sleep 5
  done
  local end="$(date +%s)"
  local dur=$((end - start))
  primary_restore=$dur
  echo "PRIMARY_RESTORE_SECONDS=$dur" >> "$metrics_file"
  log "Primary restored in ${dur}s"
}

trap restore_primary EXIT

db_identifier="drill-$start_epoch"
echo "DB_IDENTIFIER=$db_identifier" >> "$metrics_file"
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
failover=$((end_epoch - failover_start))
rto=$((end_epoch - start_epoch))
log "Restore completed in ${rto}s (failover ${failover}s)"

echo "END_TIME=$end_iso" >> "$metrics_file"
echo "RTO_SECONDS=$rto" >> "$metrics_file"
echo "FAILOVER_SECONDS=$failover" >> "$metrics_file"

if [ $rto -gt 1800 ]; then
  log "RTO exceeds threshold (${rto}s)"
  status=1
fi
restore_primary
trap - EXIT
if [ "${KEEP_INSTANCE:-false}" != "true" ]; then
  gcloud sql instances delete "$db_identifier" \
    --project "$PROJECT_ID" \
    --quiet || true
fi

log "Disaster recovery drill finished: RTO ${rto}s, snapshot RPO ${rpo_snapshot}s, wal RPO ${rpo_wal}s, failover ${failover}s, primary restore ${primary_restore:-0}s"

exit $status
