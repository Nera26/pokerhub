#!/usr/bin/env bash
set -euo pipefail

: "${PROJECT_ID?Must set PROJECT_ID}"
: "${SECONDARY_REGION?Must set SECONDARY_REGION}"
: "${PG_BACKUP_ID?Must set PG_BACKUP_ID}"
: "${CLICKHOUSE_SNAPSHOT?Must set CLICKHOUSE_SNAPSHOT}"

log() {
  echo "[$(date --iso-8601=seconds)] $*"
}

metrics_file="failover.metrics"
: > "$metrics_file"

start_iso=$(date --iso-8601=seconds)
start_all=$(date +%s)

echo "START_TIME=$start_iso" >> "$metrics_file"

echo "Fetching backup metadata..."
pg_snap_ts=$(gcloud sql backups describe "$PG_BACKUP_ID" \
  --project "$PROJECT_ID" \
  --format "value(endTime)")
pg_snap_epoch=$(date -d "$pg_snap_ts" +%s)

ch_snap_epoch=$(stat -c %Y "$CLICKHOUSE_SNAPSHOT")

rpo_pg=$((start_all - pg_snap_epoch))
rpo_ch=$((start_all - ch_snap_epoch))
rpo=$(( rpo_pg > rpo_ch ? rpo_pg : rpo_ch ))
log "Postgres snapshot age ${rpo_pg}s"
log "ClickHouse snapshot age ${rpo_ch}s"

echo "RPO_SECONDS=$rpo" >> "$metrics_file"

pg_test_id="pg-failover-$start_all"
log "Restoring Postgres backup $PG_BACKUP_ID to $pg_test_id in $SECONDARY_REGION..."
pg_start=$(date +%s)
gcloud sql instances create "$pg_test_id" \
  --project "$PROJECT_ID" \
  --region "$SECONDARY_REGION" \
  --database-version=POSTGRES_14 \
  --cpu=1 --memory=3840MiB \
  --no-assign-ip >/dev/null
gcloud beta sql backups restore "$PG_BACKUP_ID" \
  --restore-instance-name "$pg_test_id" \
  --project "$PROJECT_ID" >/dev/null
gcloud sql operations wait $(gcloud sql operations list \
  --instance "$pg_test_id" \
  --project "$PROJECT_ID" \
  --limit 1 \
  --format "value(name)") \
  --project "$PROJECT_ID" >/dev/null
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
gcloud sql instances delete "$pg_test_id" \
  --project "$PROJECT_ID" \
  --quiet || true

log "Failover test completed in ${total}s with data loss window ${rpo}s"
