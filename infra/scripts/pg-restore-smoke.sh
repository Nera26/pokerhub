#!/usr/bin/env bash
set -euo pipefail

: "${PG_BACKUP_GCS_URI:?Must set PG_BACKUP_GCS_URI}"
: "${PGHOST:=localhost}"
: "${PGUSER:=postgres}"
: "${PGDATABASE:=postgres}"
: "${PGPORT:=5432}"
: "${PGPASSWORD:?Must set PGPASSWORD}"

start_ts=$(date +%s)

# Find latest backup object
latest_line=$(gsutil ls -l "$PG_BACKUP_GCS_URI" | grep -v TOTAL | sort -k2 | tail -n1)
backup_path=$(echo "$latest_line" | awk '{print $3}')

snapshot_time=$(echo "$latest_line" | awk '{print $2}')
snapshot_ts=$(date -d "$snapshot_time" +%s)

gsutil cp "$backup_path" /tmp/pg.dump

# Restore into Postgres
pg_restore --clean --no-owner --host "$PGHOST" --port "$PGPORT" --username "$PGUSER" --dbname "$PGDATABASE" /tmp/pg.dump

end_ts=$(date +%s)
restore_duration=$(( end_ts - start_ts ))
snapshot_age=$(( start_ts - snapshot_ts ))

# Smoke queries
psql --host "$PGHOST" --port "$PGPORT" --username "$PGUSER" --dbname "$PGDATABASE" -c 'SELECT 1' >/dev/null

cat <<METRICS > restore.metrics
RESTORE_DURATION_SECONDS=$restore_duration
SNAPSHOT_AGE_SECONDS=$snapshot_age
METRICS

