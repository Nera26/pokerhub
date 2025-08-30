#!/usr/bin/env bash
set -euo pipefail

: "${PG_INSTANCE_ID:?Must set PG_INSTANCE_ID}"
: "${PG_PRIMARY_ID:?Must set PG_PRIMARY_ID}"
: "${SECONDARY_REGION:?Must set SECONDARY_REGION}"
: "${PGUSER:?Must set PGUSER}"
: "${PGPASSWORD:?Must set PGPASSWORD}"
: "${PGDATABASE:=postgres}"
: "${WAL_ARCHIVE_BUCKET:?Must set WAL_ARCHIVE_BUCKET}"

log() {
  echo "[$(date --iso-8601=seconds)] $*"
}

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
dr_dir="$(dirname "$script_dir")"

start_epoch=$(date +%s)
status=0

log "Running disaster recovery drill..."
if ! bash "$dr_dir/drill.sh"; then
  log "drill.sh failed"
  status=1
fi

log "Running latest snapshot restore..."
if ! bash "$dr_dir/restore-latest.sh"; then
  log "restore-latest.sh failed"
  status=1
fi

log "Restoring standby from latest snapshot..."
latest_snapshot=$(aws rds describe-db-snapshots \
  --db-instance-identifier "$PG_PRIMARY_ID" \
  --snapshot-type automated \
  --region "$SECONDARY_REGION" \
  --query 'reverse(sort_by(DBSnapshots, &SnapshotCreateTime))[:1].DBSnapshotIdentifier' \
  --output text)
standby_id="dr-harness-$start_epoch"
cleanup() {
  log "Cleaning up $standby_id..."
  aws rds delete-db-instance \
    --db-instance-identifier "$standby_id" \
    --skip-final-snapshot \
    --region "$SECONDARY_REGION" >/dev/null 2>&1 || true
}
trap cleanup EXIT

PG_SNAPSHOT_ID="$latest_snapshot" STANDBY_IDENTIFIER="$standby_id" bash "$dr_dir/restore-standby.sh"

endpoint=$(aws rds describe-db-instances \
  --db-instance-identifier "$standby_id" \
  --region "$SECONDARY_REGION" \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

log "Running smoke queries on $endpoint..."
hand_count=$(PGPASSWORD="$PGPASSWORD" psql -h "$endpoint" -U "$PGUSER" -d "$PGDATABASE" -t -c 'SELECT COUNT(*) FROM hand_logs;' | tr -d '[:space:]')
tourney_count=$(PGPASSWORD="$PGPASSWORD" psql -h "$endpoint" -U "$PGUSER" -d "$PGDATABASE" -t -c 'SELECT COUNT(*) FROM tournament_logs;' | tr -d '[:space:]')

if [ "${hand_count:-0}" -le 0 ]; then
  log "hand_logs table empty or missing"
  status=1
fi
if [ "${tourney_count:-0}" -le 0 ]; then
  log "tournament_logs table empty or missing"
  status=1
fi

end_epoch=$(date +%s)
rto=$((end_epoch - start_epoch))
log "Total elapsed time ${rto}s"

rpo=$(awk -F= '/RPO_SECONDS/ {print $2}' "$dr_dir/drill.metrics" || echo 0)

if [ "$rto" -gt 1800 ]; then
  log "RTO ${rto}s exceeds 30m"
  status=1
fi
if [ "$rpo" -gt 300 ]; then
  log "Last backup age ${rpo}s exceeds 5m"
  status=1
fi

echo "RTO_SECONDS=$rto"
echo "LAST_BACKUP_AGE_SECONDS=$rpo"

exit $status
