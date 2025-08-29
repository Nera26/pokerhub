#!/usr/bin/env bash
set -euo pipefail

: "${PG_INSTANCE_ID:?Must set PG_INSTANCE_ID}"
: "${SECONDARY_REGION:?Must set SECONDARY_REGION}"
: "${PGUSER:?Must set PGUSER}"
: "${PGPASSWORD:?Must set PGPASSWORD}"
: "${PGDATABASE:=postgres}"

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

rpo=$((start_epoch - snap_epoch))
log "Latest snapshot $latest_snapshot from $snap_ts (RPO ${rpo}s)"

echo "RPO_SECONDS=$rpo" >> "$metrics_file"

db_identifier="drill-$(date +%s)"
log "Restoring snapshot $latest_snapshot to $db_identifier..."
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier "$db_identifier" \
  --db-snapshot-identifier "$latest_snapshot" \
  --db-instance-class db.t3.micro \
  --no-publicly-accessible \
  --region "$SECONDARY_REGION"
aws rds wait db-instance-available \
  --db-instance-identifier "$db_identifier" \
  --region "$SECONDARY_REGION"

endpoint=$(aws rds describe-db-instances \
  --db-instance-identifier "$db_identifier" \
  --region "$SECONDARY_REGION" \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

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

aws rds delete-db-instance \
  --db-instance-identifier "$db_identifier" \
  --skip-final-snapshot \
  --region "$SECONDARY_REGION" || true

log "Disaster recovery drill finished: RTO ${rto}s, RPO ${rpo}s"
