#!/usr/bin/env bash
set -euo pipefail

: "${PG_PRIMARY_ID:?Must set PG_PRIMARY_ID}"
: "${SECONDARY_REGION:?Must set SECONDARY_REGION}"
: "${WAL_ARCHIVE_BUCKET:?Must set WAL_ARCHIVE_BUCKET}"

log() { echo "[$(date --iso-8601=seconds)] $*"; }

metrics_file="restore-wal.metrics"
: > "$metrics_file"

start_iso=$(date --iso-8601=seconds)
start_epoch=$(date +%s)
echo "START_TIME=$start_iso" >> "$metrics_file"

latest_wal=$(aws s3 ls "s3://${WAL_ARCHIVE_BUCKET}/" | sort | tail -n1 | awk '{print $4}')
wal_ts=$(aws s3api head-object --bucket "$WAL_ARCHIVE_BUCKET" --key "$latest_wal" --query 'LastModified' --output text)
wal_epoch=$(date -d "$wal_ts" +%s)
rpo=$((start_epoch - wal_epoch))
echo "RPO_SECONDS=$rpo" >> "$metrics_file"

restore_id="wal-restore-$start_epoch"
log "Restoring $PG_PRIMARY_ID to $restore_id using latest WAL..."
gcloud sql instances clone "$PG_PRIMARY_ID" "$restore_id" \
  --point-in-time "$wal_ts" \
  --region "$SECONDARY_REGION" \
  --quiet
end_epoch=$(date +%s)
rto=$((end_epoch - start_epoch))
echo "END_TIME=$(date --iso-8601=seconds)" >> "$metrics_file"
echo "RTO_SECONDS=$rto" >> "$metrics_file"

gcloud sql instances delete "$restore_id" --quiet || true

log "PITR restore finished in ${rto}s with data loss window ${rpo}s"

