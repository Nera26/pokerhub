#!/usr/bin/env bash
set -euo pipefail

: "${SECONDARY_REGION:?Must set SECONDARY_REGION}"
: "${PG_REPLICA_ID:?Must set PG_REPLICA_ID}"
: "${REDIS_REPLICA_ID:?Must set REDIS_REPLICA_ID}"
: "${ROUTE53_ZONE_ID:?Must set ROUTE53_ZONE_ID}"
: "${DB_RECORD_NAME:?Must set DB_RECORD_NAME}"
: "${REDIS_RECORD_NAME:?Must set REDIS_RECORD_NAME}"

log() {
  echo "[$(date --iso-8601=seconds)] $*"
}

log "Promoting Postgres replica $PG_REPLICA_ID in $SECONDARY_REGION..."
aws rds promote-read-replica \
  --db-instance-identifier "$PG_REPLICA_ID" \
  --region "$SECONDARY_REGION"

log "Promoting Redis replica $REDIS_REPLICA_ID in $SECONDARY_REGION..."
aws elasticache test-failover \
  --replication-group-id "$REDIS_REPLICA_ID" \
  --node-group-id 0001 \
  --region "$SECONDARY_REGION"

pg_endpoint=$(aws rds describe-db-instances \
  --db-instance-identifier "$PG_REPLICA_ID" \
  --region "$SECONDARY_REGION" \
  --query 'DBInstances[0].Endpoint.Address' --output text)

redis_endpoint=$(aws elasticache describe-replication-groups \
  --replication-group-id "$REDIS_REPLICA_ID" \
  --region "$SECONDARY_REGION" \
  --query 'ReplicationGroups[0].ConfigurationEndpoint.Address' --output text)

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

log "Updating DNS records in zone $ROUTE53_ZONE_ID..."
aws route53 change-resource-record-sets \
  --hosted-zone-id "$ROUTE53_ZONE_ID" \
  --change-batch "$change_batch"

log "Failover complete."
