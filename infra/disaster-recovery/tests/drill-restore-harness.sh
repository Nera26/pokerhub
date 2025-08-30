#!/usr/bin/env bash
set -euo pipefail

: "${PG_INSTANCE_ID?Must set PG_INSTANCE_ID}"
: "${PG_PRIMARY_ID?Must set PG_PRIMARY_ID}"
: "${SECONDARY_REGION?Must set SECONDARY_REGION}"
: "${PROJECT_ID?Must set PROJECT_ID}"
: "${PGUSER?Must set PGUSER}"
: "${PGPASSWORD?Must set PGPASSWORD}"
: "${PGDATABASE:=postgres}"
: "${WAL_ARCHIVE_BUCKET?Must set WAL_ARCHIVE_BUCKET}"

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

log "Restoring standby from latest backup..."
read latest_backup _ < <(gcloud sql backups list \
  --instance "$PG_PRIMARY_ID" \
  --project "$PROJECT_ID" \
  --sort-by "~endTime" \
  --limit 1 \
  --format "value(id,endTime)")
standby_id="dr-harness-$start_epoch"
cleanup() {
  log "Cleaning up $standby_id..."
  gcloud sql instances delete "$standby_id" \
    --project "$PROJECT_ID" \
    --quiet >/dev/null 2>&1 || true
}
trap cleanup EXIT

PG_BACKUP_ID="$latest_backup" STANDBY_IDENTIFIER="$standby_id" PROJECT_ID="$PROJECT_ID" SECONDARY_REGION="$SECONDARY_REGION" bash "$dr_dir/restore-standby.sh"

endpoint=$(gcloud sql instances describe "$standby_id" \
  --project "$PROJECT_ID" \
  --format "value(ipAddresses[0].ipAddress)")

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
