#!/usr/bin/env bash
# Promotes replicas in the secondary region and updates Route53 DNS records.
set -euo pipefail

: "${DB_REPLICA_ID?DB_REPLICA_ID must be set}"
: "${REDIS_GLOBAL_ID?REDIS_GLOBAL_ID must be set}"
: "${REPLICA_REGION?REPLICA_REGION must be set}"
: "${HOSTED_ZONE_ID?HOSTED_ZONE_ID must be set}"
: "${DB_RECORD?DB_RECORD must be set}"
: "${REDIS_RECORD?REDIS_RECORD must be set}"

aws rds promote-read-replica \
  --db-instance-identifier "$DB_REPLICA_ID" \
  --region "$REPLICA_REGION"

aws elasticache failover-global-replication-group \
  --global-replication-group-id "$REDIS_GLOBAL_ID" \
  --primary-region "$REPLICA_REGION" \
  --region "$REPLICA_REGION"

aws rds wait db-instance-available \
  --db-instance-identifier "$DB_REPLICA_ID" \
  --region "$REPLICA_REGION"

DB_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier "$DB_REPLICA_ID" \
  --region "$REPLICA_REGION" \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

REDIS_ENDPOINT=$(aws elasticache describe-replication-groups \
  --replication-group-id "${REDIS_GLOBAL_ID}-replica" \
  --region "$REPLICA_REGION" \
  --query 'ReplicationGroups[0].ConfigurationEndpoint.Address' \
  --output text)

cat > /tmp/failover-dns.json <<JSON
{
  "Comment": "Promote replicas and update endpoints",
  "Changes": [
    {"Action": "UPSERT", "ResourceRecordSet": {"Name": "$DB_RECORD", "Type": "CNAME", "TTL": 60, "ResourceRecords": [{"Value": "$DB_ENDPOINT"}] }},
    {"Action": "UPSERT", "ResourceRecordSet": {"Name": "$REDIS_RECORD", "Type": "CNAME", "TTL": 60, "ResourceRecords": [{"Value": "$REDIS_ENDPOINT"}] }}
  ]
}
JSON

aws route53 change-resource-record-sets \
  --hosted-zone-id "$HOSTED_ZONE_ID" \
  --change-batch file:///tmp/failover-dns.json

echo "Failover complete. DNS updated to secondary region." 
