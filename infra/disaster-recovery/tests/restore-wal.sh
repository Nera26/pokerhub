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
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier "$PG_PRIMARY_ID" \
  --target-db-instance-identifier "$restore_id" \
  --use-latest-restorable-time \
  --db-instance-class db.t3.micro \
  --no-publicly-accessible \
  --region "$SECONDARY_REGION"
aws rds wait db-instance-available \
  --db-instance-identifier "$restore_id" \
  --region "$SECONDARY_REGION"
end_epoch=$(date +%s)
rto=$((end_epoch - start_epoch))
echo "END_TIME=$(date --iso-8601=seconds)" >> "$metrics_file"
echo "RTO_SECONDS=$rto" >> "$metrics_file"

aws rds delete-db-instance \
  --db-instance-identifier "$restore_id" \
  --skip-final-snapshot \
  --region "$SECONDARY_REGION" || true

log "PITR restore finished in ${rto}s with data loss window ${rpo}s"

