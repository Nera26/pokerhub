#!/usr/bin/env bash
set -euo pipefail

:
"${SECONDARY_REGION:?Must set SECONDARY_REGION}"
:
"${SQL_REPLICA_INSTANCE:?Must set SQL_REPLICA_INSTANCE}"
:
"${MEMORYSTORE_INSTANCE:?Must set MEMORYSTORE_INSTANCE}"
:
"${CLOUD_DNS_ZONE:?Must set CLOUD_DNS_ZONE}"
:
"${DB_RECORD_NAME:?Must set DB_RECORD_NAME}"
:
"${REDIS_RECORD_NAME:?Must set REDIS_RECORD_NAME}"

log() {
  echo "[$(date --iso-8601=seconds)] $*"
}

log "Promoting Cloud SQL replica $SQL_REPLICA_INSTANCE in $SECONDARY_REGION..."
gcloud sql instances promote-replica "$SQL_REPLICA_INSTANCE" \
  --project "${PROJECT_ID?PROJECT_ID must be set}"

log "Failing over Memorystore instance $MEMORYSTORE_INSTANCE in $SECONDARY_REGION..."
gcloud redis instances failover "$MEMORYSTORE_INSTANCE" \
  --region "$SECONDARY_REGION" \
  --data-protection-mode limited-data-loss

pg_endpoint=$(gcloud sql instances describe "$SQL_REPLICA_INSTANCE" \
  --project "$PROJECT_ID" \
  --format="value(ipAddresses[0].ipAddress)")

redis_endpoint=$(gcloud redis instances describe "$MEMORYSTORE_INSTANCE" \
  --region "$SECONDARY_REGION" \
  --format="value(host)")

change_batch=$(cat <<JSON
{
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$DB_RECORD_NAME",
        "Type": "CNAME",
        "TTL": 60,
        "ResourceRecords": [{"Value": "$pg_endpoint"}]
      }
    },
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "$REDIS_RECORD_NAME",
        "Type": "CNAME",
        "TTL": 60,
        "ResourceRecords": [{"Value": "$redis_endpoint"}]
      }
    }
  ]
}
JSON
)

log "Updating DNS records in zone $CLOUD_DNS_ZONE..."
gcloud dns record-sets transaction start --zone "$CLOUD_DNS_ZONE"
gcloud dns record-sets transaction replace "$DB_RECORD_NAME" --type=CNAME --ttl=60 "$pg_endpoint" --zone "$CLOUD_DNS_ZONE"
gcloud dns record-sets transaction replace "$REDIS_RECORD_NAME" --type=CNAME --ttl=60 "$redis_endpoint" --zone "$CLOUD_DNS_ZONE"
gcloud dns record-sets transaction execute --zone "$CLOUD_DNS_ZONE"

log "Failover complete."
