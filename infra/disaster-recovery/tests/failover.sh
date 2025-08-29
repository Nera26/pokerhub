#!/usr/bin/env bash
set -euo pipefail

: "${SECONDARY_REGION:?Must set SECONDARY_REGION}"
: "${PG_SNAPSHOT_ID:?Must set PG_SNAPSHOT_ID}"
: "${CLICKHOUSE_SNAPSHOT:?Must set CLICKHOUSE_SNAPSHOT}"

log() {
  echo "[$(date --iso-8601=seconds)] $*"
}

metrics_file="failover.metrics"
: > "$metrics_file"

start_iso=$(date --iso-8601=seconds)
start_all=$(date +%s)

echo "START_TIME=$start_iso" >> "$metrics_file"

echo "Fetching snapshot metadata..."
pg_snap_ts=$(aws rds describe-db-snapshots \
  --db-snapshot-identifier "$PG_SNAPSHOT_ID" \
  --region "$SECONDARY_REGION" \
  --query 'DBSnapshots[0].SnapshotCreateTime' --output text)
pg_snap_epoch=$(date -d "$pg_snap_ts" +%s)

ch_snap_epoch=$(stat -c %Y "$CLICKHOUSE_SNAPSHOT")

rpo_pg=$((start_all - pg_snap_epoch))
rpo_ch=$((start_all - ch_snap_epoch))
rpo=$(( rpo_pg > rpo_ch ? rpo_pg : rpo_ch ))
log "Postgres snapshot age ${rpo_pg}s"
log "ClickHouse snapshot age ${rpo_ch}s"

echo "RPO_SECONDS=$rpo" >> "$metrics_file"

pg_test_id="pg-failover-$start_all"
log "Restoring Postgres snapshot $PG_SNAPSHOT_ID to $pg_test_id in $SECONDARY_REGION..."
pg_start=$(date +%s)
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier "$pg_test_id" \
  --db-snapshot-identifier "$PG_SNAPSHOT_ID" \
  --db-instance-class db.t3.micro \
  --no-publicly-accessible \
  --region "$SECONDARY_REGION"
aws rds wait db-instance-available \
  --db-instance-identifier "$pg_test_id" \
  --region "$SECONDARY_REGION"
pg_end=$(date +%s)
pg_time=$((pg_end - pg_start))
log "Postgres ready in ${pg_time}s"

ch_test_id="ch-failover-$start_all"
log "Restoring ClickHouse snapshot $CLICKHOUSE_SNAPSHOT to $ch_test_id in $SECONDARY_REGION..."
ch_start=$(date +%s)
# Placeholder restore using kubectl/helm; assumes snapshot manifest
kubectl --context "$SECONDARY_REGION" apply -f "$CLICKHOUSE_SNAPSHOT"
# Wait for ClickHouse statefulset readiness
kubectl --context "$SECONDARY_REGION" rollout status statefulset/clickhouse -n clickhouse
ch_end=$(date +%s)
ch_time=$((ch_end - ch_start))
log "ClickHouse ready in ${ch_time}s"

end_iso=$(date --iso-8601=seconds)
end_all=$(date +%s)
total=$((end_all - start_all))
log "Total failover time ${total}s"

echo "END_TIME=$end_iso" >> "$metrics_file"
echo "RTO_SECONDS=$total" >> "$metrics_file"

# Cleanup
aws rds delete-db-instance \
  --db-instance-identifier "$pg_test_id" \
  --skip-final-snapshot \
  --region "$SECONDARY_REGION" || true

log "Failover test completed in ${total}s with data loss window ${rpo}s"
