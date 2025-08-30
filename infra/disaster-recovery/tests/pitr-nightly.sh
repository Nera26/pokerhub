#!/usr/bin/env bash
set -euo pipefail

: "${PG_INSTANCE_ID:?Must set PG_INSTANCE_ID}"
: "${CLICKHOUSE_BUCKET:?Must set CLICKHOUSE_BUCKET}"
: "${SECONDARY_REGION:?Must set SECONDARY_REGION}"

log(){ echo "[$(date --iso-8601=seconds)] $*"; }

snap="pitr-$(date +%s)"
log "Creating Postgres backup $snap"
gcloud sql backups create --instance "$PG_INSTANCE_ID" --description "$snap"

log "Copying backup to $SECONDARY_REGION"
gcloud sql backups copy "$snap" --instance "$PG_INSTANCE_ID" --destination-region "$SECONDARY_REGION" --target-backup "${snap}-copy"

log "Restoring backup in $SECONDARY_REGION"
gcloud sql backups restore "${snap}-copy" \
  --restore-instance "${snap}-restore" \
  --region "$SECONDARY_REGION" \
  --quiet
gcloud sql instances delete "${snap}-restore" --quiet || true

log "Checking ClickHouse backup replication"
aws s3 ls "s3://${CLICKHOUSE_BUCKET}-dr/" --region "$SECONDARY_REGION" >/dev/null

log "Nightly PITR backup completed"
