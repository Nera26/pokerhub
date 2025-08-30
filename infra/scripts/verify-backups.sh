#!/usr/bin/env bash
set -euo pipefail

: "${GCP_PROJECT:?Must set GCP_PROJECT}"
: "${GCP_REGION:?Must set GCP_REGION}"
: "${PG_INSTANCE:?Must set PG_INSTANCE}"
: "${PG_BACKUP_ID:?Must set PG_BACKUP_ID}"
: "${REDIS_BACKUP_ID:?Must set REDIS_BACKUP_ID}"

echo "Verifying Cloud SQL backup $PG_BACKUP_ID for instance $PG_INSTANCE in $GCP_REGION..."
gcloud sql backups describe "$PG_BACKUP_ID" \
  --instance "$PG_INSTANCE" \
  --project "$GCP_PROJECT" >/dev/null

echo "Verifying Redis backup $REDIS_BACKUP_ID in $GCP_REGION..."
gcloud redis backups describe "$REDIS_BACKUP_ID" \
  --region "$GCP_REGION" \
  --project "$GCP_PROJECT" >/dev/null

echo "Backups verified."
