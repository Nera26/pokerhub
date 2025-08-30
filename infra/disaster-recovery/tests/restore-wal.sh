#!/usr/bin/env bash
set -euo pipefail

: "${PG_PRIMARY_ID?Must set PG_PRIMARY_ID}"
: "${SECONDARY_REGION?Must set SECONDARY_REGION}"
: "${PROJECT_ID?Must set PROJECT_ID}"
: "${WAL_ARCHIVE_BUCKET?Must set WAL_ARCHIVE_BUCKET}"

log() { echo "[$(date --iso-8601=seconds)] $*"; }

metrics_file="restore-wal.metrics"
: > "$metrics_file"

start_iso=$(date --iso-8601=seconds)
start_epoch=$(date +%s)
echo "START_TIME=$start_iso" >> "$metrics_file"

latest_wal=$(gsutil ls "gs://${WAL_ARCHIVE_BUCKET}/" | sort | tail -n1)
wal_ts=$(gsutil stat "$latest_wal" | awk -F': +' '/Creation time/ {print $2}')
wal_epoch=$(date -d "$wal_ts" +%s)
rpo=$((start_epoch - wal_epoch))
echo "RPO_SECONDS=$rpo" >> "$metrics_file"

restore_id="wal-restore-$start_epoch"
log "Restoring $PG_PRIMARY_ID to $restore_id using latest WAL..."
gcloud sql instances clone "$PG_PRIMARY_ID" "$restore_id" \
  --point-in-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --project "$PROJECT_ID" \
  --region "$SECONDARY_REGION" >/dev/null
gcloud sql operations wait $(gcloud sql operations list \
  --instance "$restore_id" \
  --project "$PROJECT_ID" \
  --limit 1 \
  --format "value(name)") \
  --project "$PROJECT_ID" >/dev/null
end_epoch=$(date +%s)
rto=$((end_epoch - start_epoch))
echo "END_TIME=$(date --iso-8601=seconds)" >> "$metrics_file"
echo "RTO_SECONDS=$rto" >> "$metrics_file"

gcloud sql instances delete "$restore_id" \
  --project "$PROJECT_ID" \
  --quiet || true

log "PITR restore finished in ${rto}s with data loss window ${rpo}s"

