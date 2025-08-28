#!/usr/bin/env bash
set -euo pipefail

: "${SECONDARY_REGION:?Must set SECONDARY_REGION}"
: "${PG_SNAPSHOT_ID:?Must set PG_SNAPSHOT_ID}"
: "${CLICKHOUSE_SNAPSHOT:?Must set CLICKHOUSE_SNAPSHOT}"

log() {
  echo "[$(date --iso-8601=seconds)] $*"
}

start_all=$(date +%s)

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

end_all=$(date +%s)
total=$((end_all - start_all))
log "Total failover time ${total}s"

if [ "$total" -gt 1800 ]; then
  log "Failover exceeded 30 minutes"
  exit 1
fi

# Cleanup
aws rds delete-db-instance \
  --db-instance-identifier "$pg_test_id" \
  --skip-final-snapshot \
  --region "$SECONDARY_REGION" || true

log "Failover test completed in ${total}s"
