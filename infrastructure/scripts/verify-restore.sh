#!/usr/bin/env bash
# Restores the latest Postgres snapshot into a temporary instance and runs a smoke query.
set -euo pipefail

: "${DB_INSTANCE?DB_INSTANCE must be set}"
: "${RESTORE_REGION?RESTORE_REGION must be set}"
: "${DB_USER?DB_USER must be set}"
: "${DB_PASSWORD?DB_PASSWORD must be set}"

SNAPSHOT_ID=$(aws rds describe-db-snapshots \
  --db-instance-identifier "$DB_INSTANCE" \
  --query 'DBSnapshots[-1].DBSnapshotIdentifier' \
  --output text)

RESTORE_ID="${DB_INSTANCE}-verify-$(date +%s)"

echo "Restoring snapshot $SNAPSHOT_ID to $RESTORE_ID in $RESTORE_REGION..."
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier "$RESTORE_ID" \
  --db-snapshot-identifier "$SNAPSHOT_ID" \
  --region "$RESTORE_REGION" >/dev/null

aws rds wait db-instance-available \
  --db-instance-identifier "$RESTORE_ID" \
  --region "$RESTORE_REGION"

ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier "$RESTORE_ID" \
  --region "$RESTORE_REGION" \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

PGPASSWORD="$DB_PASSWORD" psql -h "$ENDPOINT" -U "$DB_USER" -d postgres -c 'SELECT 1;' >/dev/null

echo "Cleaning up $RESTORE_ID..."
aws rds delete-db-instance \
  --db-instance-identifier "$RESTORE_ID" \
  --skip-final-snapshot \
  --region "$RESTORE_REGION" >/dev/null

echo "Restore verification succeeded for snapshot $SNAPSHOT_ID" 
