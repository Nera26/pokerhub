#!/usr/bin/env bash
set -euo pipefail

: "${PG_INSTANCE_ID:?Must set PG_INSTANCE_ID}"
: "${CLICKHOUSE_BUCKET:?Must set CLICKHOUSE_BUCKET}"
: "${SECONDARY_REGION:?Must set SECONDARY_REGION}"

log(){ echo "[$(date --iso-8601=seconds)] $*"; }

snap="pitr-$(date +%s)"
log "Creating Postgres snapshot $snap"
aws rds create-db-snapshot \
  --db-instance-identifier "$PG_INSTANCE_ID" \
  --db-snapshot-identifier "$snap"
aws rds wait db-snapshot-available \
  --db-snapshot-identifier "$snap"

log "Copying snapshot to $SECONDARY_REGION"
aws rds copy-db-snapshot \
  --source-db-snapshot-identifier "$snap" \
  --target-db-snapshot-identifier "${snap}-copy" \
  --region "$SECONDARY_REGION"

log "Restoring snapshot in $SECONDARY_REGION"
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier "${snap}-restore" \
  --db-snapshot-identifier "${snap}-copy" \
  --db-instance-class db.t3.micro \
  --no-publicly-accessible \
  --region "$SECONDARY_REGION"
aws rds delete-db-instance \
  --db-instance-identifier "${snap}-restore" \
  --skip-final-snapshot \
  --region "$SECONDARY_REGION" || true

log "Checking ClickHouse backup replication"
aws s3 ls "s3://${CLICKHOUSE_BUCKET}-dr/" --region "$SECONDARY_REGION" >/dev/null

log "Nightly PITR backup completed"
