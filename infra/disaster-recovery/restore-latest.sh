#!/usr/bin/env bash
# Restores the latest Postgres snapshot into a temporary instance and checks RTO/RPO.
set -euo pipefail

: "${PG_PRIMARY_ID:?Must set PG_PRIMARY_ID}"
: "${SECONDARY_REGION:?Must set SECONDARY_REGION}"
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

log "Finding latest snapshot for $PG_PRIMARY_ID in $SECONDARY_REGION..."
latest_snapshot=$(aws rds describe-db-snapshots \
  --db-instance-identifier "$PG_PRIMARY_ID" \
  --snapshot-type automated \
  --region "$SECONDARY_REGION" \
  --query 'reverse(sort_by(DBSnapshots, &SnapshotCreateTime))[:1].DBSnapshotIdentifier' \
  --output text)

snap_ts=$(aws rds describe-db-snapshots \
  --db-snapshot-identifier "$latest_snapshot" \
  --region "$SECONDARY_REGION" \
  --query 'DBSnapshots[0].SnapshotCreateTime' \
  --output text)

snap_epoch=$(date -d "$snap_ts" +%s)
rpo=$((start_epoch - snap_epoch))
log "Latest snapshot $latest_snapshot from $snap_ts (RPO ${rpo}s)"

echo "RPO_SECONDS=$rpo" >> "$metrics_file"

restore_id="restore-latest-$start_epoch"

cleanup() {
  log "Cleaning up $restore_id..."
  aws rds delete-db-instance \
    --db-instance-identifier "$restore_id" \
    --skip-final-snapshot \
    --region "$SECONDARY_REGION" >/dev/null 2>&1 || true
}
trap cleanup EXIT

log "Restoring snapshot $latest_snapshot to $restore_id..."
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier "$restore_id" \
  --db-snapshot-identifier "$latest_snapshot" \
  --db-instance-class db.t3.micro \
  --no-publicly-accessible \
  --region "$SECONDARY_REGION" >/dev/null

aws rds wait db-instance-available \
  --db-instance-identifier "$restore_id" \
  --region "$SECONDARY_REGION" >/dev/null

endpoint=$(aws rds describe-db-instances \
  --db-instance-identifier "$restore_id" \
  --region "$SECONDARY_REGION" \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

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
