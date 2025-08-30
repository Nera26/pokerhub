#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

: "${PRIMARY_REGION?Must set PRIMARY_REGION}"
: "${SECONDARY_REGION?Must set SECONDARY_REGION}"
: "${PG_INSTANCE_ID?Must set PG_INSTANCE_ID}"
: "${PROJECT_ID?Must set PROJECT_ID}"
: "${PGUSER?Must set PGUSER}"
: "${PGPASSWORD?Must set PGPASSWORD}"
: "${PGDATABASE:=postgres}"
: "${WAL_ARCHIVE_BUCKET?Must set WAL_ARCHIVE_BUCKET}"

log() {
  echo "[$(date --iso-8601=seconds)] $*"
}

log "Provisioning standby infrastructure in $SECONDARY_REGION..."
pushd ../terraform >/dev/null
terraform init -input=false >/dev/null
terraform apply -input=false -auto-approve >/dev/null
popd >/dev/null

log "Fetching primary endpoint in $PRIMARY_REGION..."
primary_endpoint=$(gcloud sql instances describe "$PG_INSTANCE_ID" \
  --project "$PROJECT_ID" \
  --format "value(ipAddresses[0].ipAddress)")

log "Capturing table count from primary $primary_endpoint..."
primary_count=$(PGHOST="$primary_endpoint" PGPORT=5432 psql \
  --username "$PGUSER" \
  --dbname "$PGDATABASE" \
  -At -c "SELECT count(*) FROM pg_catalog.pg_tables;")

log "Running disaster recovery drill via drill.sh..."
KEEP_INSTANCE=true PG_INSTANCE_ID="$PG_INSTANCE_ID" SECONDARY_REGION="$SECONDARY_REGION" \
  PROJECT_ID="$PROJECT_ID" PGUSER="$PGUSER" PGPASSWORD="$PGPASSWORD" PGDATABASE="$PGDATABASE" \
  WAL_ARCHIVE_BUCKET="$WAL_ARCHIVE_BUCKET" ../drill.sh

metrics="drill.metrics"
db_id=$(grep DB_IDENTIFIER "$metrics" | cut -d= -f2)
endpoint=$(grep DB_ENDPOINT "$metrics" | cut -d= -f2)

log "Validating data parity on $endpoint..."
standby_count=$(PGHOST="$endpoint" PGPORT=5432 psql \
  --username "$PGUSER" \
  --dbname "$PGDATABASE" \
  -At -c "SELECT count(*) FROM pg_catalog.pg_tables;")

status=0
if [ "$primary_count" != "$standby_count" ]; then
  log "Data parity mismatch: primary $primary_count vs standby $standby_count"
  status=1
else
  log "Data parity confirmed: $standby_count tables"
fi

log "Tearing down drill instance $db_id..."
gcloud sql instances delete "$db_id" \
  --project "$PROJECT_ID" \
  --quiet || true

log "Destroying standby infrastructure..."
pushd ../terraform >/dev/null
terraform destroy -input=false -auto-approve >/dev/null
popd >/dev/null

exit $status
