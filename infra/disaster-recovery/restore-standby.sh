#!/usr/bin/env bash
set -euo pipefail

: "${SECONDARY_REGION:?Must set SECONDARY_REGION}"
: "${PG_SNAPSHOT_ID:?Must set PG_SNAPSHOT_ID}"

PROMOTE="${PROMOTE:-false}"
STANDBY_IDENTIFIER="${STANDBY_IDENTIFIER:-standby-$PG_SNAPSHOT_ID}"

log() {
  echo "[$(date --iso-8601=seconds)] $*"
}

log "Restoring snapshot $PG_SNAPSHOT_ID to $SECONDARY_REGION as $STANDBY_IDENTIFIER..."
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier "$STANDBY_IDENTIFIER" \
  --db-snapshot-identifier "$PG_SNAPSHOT_ID" \
  --db-instance-class db.t3.micro \
  --no-publicly-accessible \
  --region "$SECONDARY_REGION"
aws rds wait db-instance-available \
  --db-instance-identifier "$STANDBY_IDENTIFIER" \
  --region "$SECONDARY_REGION"

if [ "$PROMOTE" = "true" ]; then
  log "Promoting $STANDBY_IDENTIFIER to primary in $SECONDARY_REGION..."
  aws rds promote-read-replica \
    --db-instance-identifier "$STANDBY_IDENTIFIER" \
    --region "$SECONDARY_REGION"
  log "Promotion requested for $STANDBY_IDENTIFIER"
else
  log "Snapshot restored as $STANDBY_IDENTIFIER in standby mode"
fi
