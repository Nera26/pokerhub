#!/usr/bin/env bash
set -euo pipefail

: "${PG_INSTANCE_ID?Must set PG_INSTANCE_ID}"
: "${CLICKHOUSE_BUCKET?Must set CLICKHOUSE_BUCKET}"
: "${SECONDARY_REGION?Must set SECONDARY_REGION}"
: "${PROJECT_ID?Must set PROJECT_ID}"

log(){ echo "[$(date --iso-8601=seconds)] $*"; }

snap="pitr-$(date +%s)"
log "Creating Cloud SQL backup $snap"
gcloud sql backups create \
  --instance "$PG_INSTANCE_ID" \
  --project "$PROJECT_ID" >/dev/null

log "Copying backup to $SECONDARY_REGION (placeholder)"
# gcloud sql backups copy not available; implement via API or export if needed

log "Restoring backup in $SECONDARY_REGION"
gcloud sql instances create "${snap}-restore" \
  --project "$PROJECT_ID" \
  --region "$SECONDARY_REGION" \
  --database-version=POSTGRES_14 \
  --cpu=1 --memory=3840MiB \
  --no-assign-ip >/dev/null
gcloud beta sql backups restore "$snap" \
  --restore-instance-name "${snap}-restore" \
  --project "$PROJECT_ID" >/dev/null
gcloud sql instances delete "${snap}-restore" \
  --project "$PROJECT_ID" \
  --quiet || true

log "Checking ClickHouse backup replication"
gsutil ls "gs://${CLICKHOUSE_BUCKET}-dr/" >/dev/null

log "Nightly PITR backup completed"
