#!/usr/bin/env bash
# Promotes replicas in the secondary region and updates Cloud DNS records.
set -euo pipefail

: "${SQL_REPLICA_INSTANCE?SQL_REPLICA_INSTANCE must be set}"
: "${REDIS_INSTANCE_ID?REDIS_INSTANCE_ID must be set}"
: "${REPLICA_REGION?REPLICA_REGION must be set}"
: "${DNS_ZONE?DNS_ZONE must be set}"
: "${DB_RECORD?DB_RECORD must be set}"
: "${REDIS_RECORD?REDIS_RECORD must be set}"

gcloud sql instances promote-replica "$SQL_REPLICA_INSTANCE"

gcloud redis instances failover "$REDIS_INSTANCE_ID" \
  --region "$REPLICA_REGION"

DB_ENDPOINT=$(gcloud sql instances describe "$SQL_REPLICA_INSTANCE" \
  --format='value(ipAddresses[0].ipAddress)')

REDIS_ENDPOINT=$(gcloud redis instances describe "$REDIS_INSTANCE_ID" \
  --region "$REPLICA_REGION" \
  --format='value(host)')

gcloud dns record-sets transaction start --zone="$DNS_ZONE"
gcloud dns record-sets transaction add "$DB_ENDPOINT" \
  --name="$DB_RECORD" --ttl=60 --type=CNAME --zone="$DNS_ZONE"
gcloud dns record-sets transaction add "$REDIS_ENDPOINT" \
  --name="$REDIS_RECORD" --ttl=60 --type=CNAME --zone="$DNS_ZONE"
gcloud dns record-sets transaction execute --zone="$DNS_ZONE"

echo "Failover complete. DNS updated to secondary region."
