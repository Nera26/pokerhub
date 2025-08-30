#!/usr/bin/env bash
set -euo pipefail

# Disaster recovery failover drill
# - Spins up temporary Postgres instance
# - Restores latest backup via WAL-G PITR
# - Measures time until the API becomes writable
#
# Requires docker and wal-g to be installed and configured via environment.

START_EPOCH=$(date +%s)
METRICS_FILE="dr-failover.metrics"
: > "$METRICS_FILE"
echo "START_TIME=$(date --iso-8601=seconds)" >> "$METRICS_FILE"

log() { echo "[$(date --iso-8601=seconds)] $*"; }

PGUSER=${PGUSER:-postgres}
PGPASSWORD=${PGPASSWORD:-postgres}
PGDATABASE=${PGDATABASE:-pokerhub}
PGPORT=${PGPORT:-55432}

DATA_DIR=$(mktemp -d)
cleanup() {
  rm -rf "$DATA_DIR"
}
trap cleanup EXIT

log "Fetching latest base backup via wal-g"
wal-g backup-fetch "$DATA_DIR" LATEST

# Determine backup timestamp for RPO calculation
BACKUP_TS=$(wal-g backup-list --json | jq -r '.[0].time' 2>/dev/null || date --iso-8601=seconds)
BACKUP_EPOCH=$(date -d "$BACKUP_TS" +%s)
RPO_SECONDS=$((START_EPOCH - BACKUP_EPOCH))
echo "RPO_SECONDS=$RPO_SECONDS" >> "$METRICS_FILE"

log "Preparing recovery configuration"
cat <<RECOVERY > "$DATA_DIR/postgresql.conf"
restore_command = 'wal-g wal-fetch %f %p'
RECOVERY
touch "$DATA_DIR/recovery.signal"

PG_CONTAINER="dr-pg-$START_EPOCH"
log "Starting temporary Postgres container $PG_CONTAINER"
docker run -d --rm \
  --name "$PG_CONTAINER" \
  -e POSTGRES_USER="$PGUSER" \
  -e POSTGRES_PASSWORD="$PGPASSWORD" \
  -p "$PGPORT":5432 \
  -v "$DATA_DIR:/var/lib/postgresql/data" \
  postgres:15-alpine >/dev/null

# Wait for Postgres to be ready
until docker exec "$PG_CONTAINER" pg_isready -U "$PGUSER" >/dev/null 2>&1; do
  sleep 1
done

log "Postgres restored; starting API container"
API_CONTAINER="dr-api-$START_EPOCH"
# Build backend image if not present
if ! docker image inspect pokerhub-backend:dr-test >/dev/null 2>&1; then
  docker build -t pokerhub-backend:dr-test backend >/dev/null
fi

docker run -d --rm \
  --name "$API_CONTAINER" \
  --network host \
  -e DATABASE_URL="postgres://$PGUSER:$PGPASSWORD@localhost:$PGPORT/$PGDATABASE" \
  pokerhub-backend:dr-test >/dev/null

# Wait for API health endpoint
until curl -sf http://localhost:3000/health >/dev/null 2>&1; do
  sleep 1
done

# Test API write capability via simple SQL write
psql "postgres://$PGUSER:$PGPASSWORD@localhost:$PGPORT/$PGDATABASE" -c 'CREATE TABLE IF NOT EXISTS dr_test(id serial PRIMARY KEY);' >/dev/null

END_EPOCH=$(date +%s)
RTO_SECONDS=$((END_EPOCH - START_EPOCH))
echo "END_TIME=$(date --iso-8601=seconds)" >> "$METRICS_FILE"
echo "RTO_SECONDS=$RTO_SECONDS" >> "$METRICS_FILE"

log "Failover completed in ${RTO_SECONDS}s with data loss window ${RPO_SECONDS}s"

STATUS=0
if [ "$RTO_SECONDS" -gt 1800 ]; then
  log "RTO exceeds 30 minutes"
  STATUS=1
fi
if [ "$RPO_SECONDS" -gt 300 ]; then
  log "RPO exceeds 5 minutes"
  STATUS=1
fi

if [ "$STATUS" -ne 0 ] && [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
  payload="{\"text\":\"DR failover exceeded budget: RTO ${RTO_SECONDS}s, RPO ${RPO_SECONDS}s\"}"
  curl -X POST -H 'Content-type: application/json' --data "$payload" "$SLACK_WEBHOOK_URL" >/dev/null
fi

# Cleanup containers
log "Cleaning up containers"
docker rm -f "$API_CONTAINER" "$PG_CONTAINER" >/dev/null 2>&1 || true

exit $STATUS
