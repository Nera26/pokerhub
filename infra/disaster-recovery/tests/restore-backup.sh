#!/usr/bin/env bash
set -euo pipefail

: "${SECONDARY_REGION:?Must set SECONDARY_REGION}"
: "${PG_SNAPSHOT_ID:?Must set PG_SNAPSHOT_ID}"

log() {
  echo "[$(date --iso-8601=seconds)] $*"
}

metrics_file="restore-backup.metrics"
: > "$metrics_file"

start_iso=$(date --iso-8601=seconds)
start_epoch=$(date +%s)

echo "START_TIME=$start_iso" >> "$metrics_file"

log "Fetching snapshot metadata..."
snap_ts=$(aws rds describe-db-snapshots \
  --db-snapshot-identifier "$PG_SNAPSHOT_ID" \
  --region "$SECONDARY_REGION" \
  --query 'DBSnapshots[0].SnapshotCreateTime' --output text)
snap_epoch=$(date -d "$snap_ts" +%s)

rpo=$((start_epoch - snap_epoch))
log "Snapshot age ${rpo}s"
echo "RPO_SECONDS=$rpo" >> "$metrics_file"

restore_id="restore-test-$start_epoch"
log "Restoring snapshot $PG_SNAPSHOT_ID to $restore_id in $SECONDARY_REGION..."
restore_start=$(date +%s)
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier "$restore_id" \
  --db-snapshot-identifier "$PG_SNAPSHOT_ID" \
  --db-instance-class db.t3.micro \
  --no-publicly-accessible \
  --region "$SECONDARY_REGION"
aws rds wait db-instance-available \
  --db-instance-identifier "$restore_id" \
  --region "$SECONDARY_REGION"
restore_end=$(date +%s)

rto=$((restore_end - start_epoch))
log "Restore completed in ${rto}s"

end_iso=$(date --iso-8601=seconds)
echo "END_TIME=$end_iso" >> "$metrics_file"
echo "RTO_SECONDS=$rto" >> "$metrics_file"

# Cleanup
aws rds delete-db-instance \
  --db-instance-identifier "$restore_id" \
  --skip-final-snapshot \
  --region "$SECONDARY_REGION" || true

log "Backup restore test completed in ${rto}s with data loss window ${rpo}s"
