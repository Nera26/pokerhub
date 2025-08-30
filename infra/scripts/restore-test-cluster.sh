#!/usr/bin/env bash
set -euo pipefail

: "${GCP_PROJECT:?Must set GCP_PROJECT}"
: "${GCP_REGION:?Must set GCP_REGION}"
: "${PG_BACKUP_ID:?Must set PG_BACKUP_ID}"
: "${REDIS_BACKUP_ID:?Must set REDIS_BACKUP_ID}"

pg_test_id="pg-restore-test-$(date +%s)"
redis_test_id="redis-restore-test-$(date +%s)"

echo "Restoring Cloud SQL backup $PG_BACKUP_ID to $pg_test_id in $GCP_REGION..."
gcloud sql instances create "$pg_test_id" \
  --project "$GCP_PROJECT" \
  --region "$GCP_REGION" \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro >/dev/null
gcloud sql backups restore "$PG_BACKUP_ID" \
  --instance "$pg_test_id" \
  --project "$GCP_PROJECT" >/dev/null
gcloud sql instances delete "$pg_test_id" \
  --project "$GCP_PROJECT" \
  --quiet >/dev/null

echo "Restoring Redis backup $REDIS_BACKUP_ID to $redis_test_id in $GCP_REGION..."
gcloud redis instances create "$redis_test_id" \
  --region "$GCP_REGION" \
  --tier=STANDARD_HA \
  --size=1 \
  --project "$GCP_PROJECT" >/dev/null
gcloud redis backups restore "$REDIS_BACKUP_ID" \
  --instance "$redis_test_id" \
  --region "$GCP_REGION" \
  --project "$GCP_PROJECT" >/dev/null
gcloud redis instances delete "$redis_test_id" \
  --region "$GCP_REGION" \
  --project "$GCP_PROJECT" \
  --quiet >/dev/null

echo "Restore test completed."
