#!/usr/bin/env bash
# Restores the latest Postgres backup into a temporary Cloud SQL instance and runs a smoke query.
set -euo pipefail

: "${SQL_INSTANCE?SQL_INSTANCE must be set}"
: "${RESTORE_REGION?RESTORE_REGION must be set}"
: "${DB_USER?DB_USER must be set}"
: "${DB_PASSWORD?DB_PASSWORD must be set}"

SNAPSHOT_ID=$(gcloud sql backups list \
  --instance "$SQL_INSTANCE" \
  --sort-by~'endTime' \
  --limit 1 \
  --format 'value(id)')

RESTORE_ID="${SQL_INSTANCE}-verify-$(date +%s)"

echo "Restoring backup $SNAPSHOT_ID to $RESTORE_ID in $RESTORE_REGION..."
gcloud sql backups restore "$SNAPSHOT_ID" \
  --restore-instance="$RESTORE_ID" \
  --region "$RESTORE_REGION" >/dev/null

ENDPOINT=$(gcloud sql instances describe "$RESTORE_ID" \
  --format='value(ipAddresses[0].ipAddress)')

PGPASSWORD="$DB_PASSWORD" psql -h "$ENDPOINT" -U "$DB_USER" -d postgres -c 'SELECT 1;' >/dev/null

echo "Cleaning up $RESTORE_ID..."
gcloud sql instances delete "$RESTORE_ID" --quiet >/dev/null

echo "Restore verification succeeded for backup $SNAPSHOT_ID"
