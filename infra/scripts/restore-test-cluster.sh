#!/usr/bin/env bash
set -euo pipefail

: "${SECONDARY_REGION:?Must set SECONDARY_REGION}"
: "${PG_SNAPSHOT_ID:?Must set PG_SNAPSHOT_ID}"
: "${REDIS_SNAPSHOT_ID:?Must set REDIS_SNAPSHOT_ID}"

pg_test_id="pg-restore-test-$(date +%s)"
redis_test_id="redis-restore-test-$(date +%s)"

echo "Restoring Postgres snapshot $PG_SNAPSHOT_ID to $pg_test_id in $SECONDARY_REGION..."
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier "$pg_test_id" \
  --db-snapshot-identifier "$PG_SNAPSHOT_ID" \
  --db-instance-class db.t3.micro \
  --no-publicly-accessible \
  --region "$SECONDARY_REGION"
aws rds wait db-instance-available \
  --db-instance-identifier "$pg_test_id" \
  --region "$SECONDARY_REGION"
aws rds delete-db-instance \
  --db-instance-identifier "$pg_test_id" \
  --skip-final-snapshot \
  --region "$SECONDARY_REGION"

echo "Restoring Redis snapshot $REDIS_SNAPSHOT_ID to $redis_test_id in $SECONDARY_REGION..."
aws elasticache restore-replication-group-from-snapshot \
  --replication-group-id "$redis_test_id" \
  --snapshot-name "$REDIS_SNAPSHOT_ID" \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --region "$SECONDARY_REGION"
aws elasticache wait replication-group-available \
  --replication-group-id "$redis_test_id" \
  --region "$SECONDARY_REGION"
aws elasticache delete-replication-group \
  --replication-group-id "$redis_test_id" \
  --region "$SECONDARY_REGION"

echo "Restore test completed."
