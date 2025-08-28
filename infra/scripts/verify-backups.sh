#!/usr/bin/env bash
set -euo pipefail

: "${SECONDARY_REGION:?Must set SECONDARY_REGION}"
: "${PG_SNAPSHOT_ID:?Must set PG_SNAPSHOT_ID}"
: "${REDIS_SNAPSHOT_ID:?Must set REDIS_SNAPSHOT_ID}"

echo "Verifying Postgres snapshot $PG_SNAPSHOT_ID in $SECONDARY_REGION..."
aws rds describe-db-snapshots \
  --region "$SECONDARY_REGION" \
  --db-snapshot-identifier "$PG_SNAPSHOT_ID" >/dev/null

echo "Verifying Redis snapshot $REDIS_SNAPSHOT_ID in $SECONDARY_REGION..."
aws elasticache describe-snapshots \
  --region "$SECONDARY_REGION" \
  --snapshot-name "$REDIS_SNAPSHOT_ID" >/dev/null

echo "Backups verified."
