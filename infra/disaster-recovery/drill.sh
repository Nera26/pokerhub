#!/usr/bin/env bash
set -euo pipefail

: "${PG_INSTANCE_ID:?Must set PG_INSTANCE_ID}"
: "${SECONDARY_REGION:?Must set SECONDARY_REGION}"
: "${PGUSER:?Must set PGUSER}"
: "${PGPASSWORD:?Must set PGPASSWORD}"
: "${PGDATABASE:=postgres}"
: "${WAL_ARCHIVE_BUCKET:?Must set WAL_ARCHIVE_BUCKET}"

log() {
  echo "[$(date --iso-8601=seconds)] $*"
}

metrics_file="drill.metrics"
: > "$metrics_file"

start_iso=$(date --iso-8601=seconds)
start_epoch=$(date +%s)

echo "START_TIME=$start_iso" >> "$metrics_file"

log "Finding latest snapshot for $PG_INSTANCE_ID in $SECONDARY_REGION..."
latest_snapshot=$(aws rds describe-db-snapshots \
  --db-instance-identifier "$PG_INSTANCE_ID" \
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
rpo_snapshot=$((start_epoch - snap_epoch))
log "Latest snapshot $latest_snapshot from $snap_ts (snapshot RPO ${rpo_snapshot}s)"

latest_wal=$(aws s3 ls "s3://${WAL_ARCHIVE_BUCKET}/" | sort | tail -n1 | awk '{print $4}')
wal_ts=$(aws s3api head-object --bucket "$WAL_ARCHIVE_BUCKET" --key "$latest_wal" --query 'LastModified' --output text)
wal_epoch=$(date -d "$wal_ts" +%s)
rpo_wal=$((start_epoch - wal_epoch))
log "Latest WAL $latest_wal from $wal_ts (wal RPO ${rpo_wal}s)"

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

log "Restoring snapshot $latest_snapshot to $db_identifier via standby script..."
PG_SNAPSHOT_ID="$latest_snapshot" STANDBY_IDENTIFIER="$db_identifier" PROMOTE=true \
  bash "$(dirname "$0")/restore-standby.sh"

endpoint=$(aws rds describe-db-instances \
  --db-instance-identifier "$db_identifier" \
  --region "$SECONDARY_REGION" \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)
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
  aws rds delete-db-instance \
    --db-instance-identifier "$db_identifier" \
    --skip-final-snapshot \
    --region "$SECONDARY_REGION" || true
fi

log "Disaster recovery drill finished: RTO ${rto}s, snapshot RPO ${rpo_snapshot}s, wal RPO ${rpo_wal}s"

exit $status
