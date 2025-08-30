#!/usr/bin/env bash
set -euo pipefail

: "${SECONDARY_REGION:?Must set SECONDARY_REGION}"
: "${SQL_REPLICA_INSTANCE:?Must set SQL_REPLICA_INSTANCE}"
: "${REDIS_INSTANCE_ID:?Must set REDIS_INSTANCE_ID}"
: "${DNS_ZONE:?Must set DNS_ZONE}"
: "${DB_RECORD_NAME:?Must set DB_RECORD_NAME}"
: "${REDIS_RECORD_NAME:?Must set REDIS_RECORD_NAME}"

log() {
  echo "[$(date --iso-8601=seconds)] $*"
}

log "Promoting Postgres replica $SQL_REPLICA_INSTANCE in $SECONDARY_REGION..."
gcloud sql instances promote-replica "$SQL_REPLICA_INSTANCE"

log "Promoting Redis replica $REDIS_INSTANCE_ID in $SECONDARY_REGION..."
gcloud redis instances failover "$REDIS_INSTANCE_ID" \
  --region "$SECONDARY_REGION"

pg_endpoint=$(gcloud sql instances describe "$SQL_REPLICA_INSTANCE" \
  --format='value(ipAddresses[0].ipAddress)')

redis_endpoint=$(gcloud redis instances describe "$REDIS_INSTANCE_ID" \
  --region "$SECONDARY_REGION" \
  --format='value(host)')

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

log "Updating DNS records in zone $DNS_ZONE..."
gcloud dns record-sets transaction start --zone="$DNS_ZONE"
gcloud dns record-sets transaction add "$pg_endpoint" --name="$DB_RECORD_NAME" --ttl=60 --type=CNAME --zone="$DNS_ZONE"
gcloud dns record-sets transaction add "$redis_endpoint" --name="$REDIS_RECORD_NAME" --ttl=60 --type=CNAME --zone="$DNS_ZONE"
gcloud dns record-sets transaction execute --zone="$DNS_ZONE"

log "Failover complete."
