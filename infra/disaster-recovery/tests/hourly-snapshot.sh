#!/usr/bin/env bash
set -euo pipefail

: "${PG_INSTANCE_ID:?Must set PG_INSTANCE_ID}"
: "${SECONDARY_REGION:?Must set SECONDARY_REGION}"

log() { echo "[$(date --iso-8601=seconds)] $*"; }

snap="hourly-$(date +%s)"
log "Creating Postgres snapshot $snap"
aws rds create-db-snapshot \
  --db-instance-identifier "$PG_INSTANCE_ID" \
  --db-snapshot-identifier "$snap" >/dev/null
aws rds wait db-snapshot-available \
  --db-snapshot-identifier "$snap" >/dev/null

log "Copying snapshot to $SECONDARY_REGION"
aws rds copy-db-snapshot \
  --source-db-snapshot-identifier "$snap" \
  --target-db-snapshot-identifier "${snap}-copy" \
  --region "$SECONDARY_REGION" >/dev/null

log "Hourly snapshot completed"

