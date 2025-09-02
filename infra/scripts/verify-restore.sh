#!/usr/bin/env bash
# Restores the latest Postgres snapshot into a temporary instance and runs a smoke query.
set -euo pipefail

: "${DB_INSTANCE?DB_INSTANCE must be set}"
: "${PROJECT_ID?PROJECT_ID must be set}"
: "${DB_USER?DB_USER must be set}"
: "${DB_PASSWORD?DB_PASSWORD must be set}"

BACKUP_ID=$(gcloud sql backups list \
  --instance "$DB_INSTANCE" \
  --project "$PROJECT_ID" \
  --sort-by "~endTime" \
  --limit 1 \
  --format "value(id)")

RESTORE_ID="${DB_INSTANCE}-verify-$(date +%s)"

echo "Restoring backup $BACKUP_ID to $RESTORE_ID..."
gcloud beta sql backups restore "$BACKUP_ID" \
  --backup-instance "$DB_INSTANCE" \
  --restore-instance-name "$RESTORE_ID" \
  --project "$PROJECT_ID" >/dev/null

gcloud sql operations wait $(gcloud sql operations list \
  --instance "$RESTORE_ID" \
  --project "$PROJECT_ID" \
  --limit 1 \
  --format "value(name)") \
  --project "$PROJECT_ID" >/dev/null

ENDPOINT=$(gcloud sql instances describe "$RESTORE_ID" \
  --project "$PROJECT_ID" \
  --format "value(ipAddresses[0].ipAddress)")

PGPASSWORD="$DB_PASSWORD" psql -h "$ENDPOINT" -U "$DB_USER" -d postgres -c 'SELECT 1;' >/dev/null

echo "Cleaning up $RESTORE_ID..."
gcloud sql instances delete "$RESTORE_ID" \
  --project "$PROJECT_ID" \
  --quiet >/dev/null

echo "Restore verification succeeded for backup $BACKUP_ID"
