#!/usr/bin/env bash
# Promotes replicas in the secondary region and updates Cloud DNS records.
set -euo pipefail

: "${SQL_REPLICA_INSTANCE?SQL_REPLICA_INSTANCE must be set}"
: "${MEMORYSTORE_INSTANCE?MEMORYSTORE_INSTANCE must be set}"
: "${REPLICA_REGION?REPLICA_REGION must be set}"
: "${CLOUD_DNS_ZONE?CLOUD_DNS_ZONE must be set}"
: "${DB_RECORD?DB_RECORD must be set}"
: "${REDIS_RECORD?REDIS_RECORD must be set}"

gcloud sql instances promote-replica "$SQL_REPLICA_INSTANCE" \
  --project "${PROJECT_ID?PROJECT_ID must be set}"

gcloud redis instances failover "$MEMORYSTORE_INSTANCE" \
  --region "$REPLICA_REGION" \
  --data-protection-mode limited-data-loss

DB_ENDPOINT=$(gcloud sql instances describe "$SQL_REPLICA_INSTANCE" \
  --project "$PROJECT_ID" \
  --format="value(ipAddresses[0].ipAddress)")

REDIS_ENDPOINT=$(gcloud redis instances describe "$MEMORYSTORE_INSTANCE" \
  --region "$REPLICA_REGION" \
  --format="value(host)")

gcloud dns record-sets transaction start --zone "$CLOUD_DNS_ZONE"
gcloud dns record-sets transaction replace "$DB_RECORD" --type=CNAME --ttl=60 "$DB_ENDPOINT" --zone "$CLOUD_DNS_ZONE"
gcloud dns record-sets transaction replace "$REDIS_RECORD" --type=CNAME --ttl=60 "$REDIS_ENDPOINT" --zone "$CLOUD_DNS_ZONE"
gcloud dns record-sets transaction execute --zone "$CLOUD_DNS_ZONE"

echo "Failover complete. DNS updated to secondary region."
