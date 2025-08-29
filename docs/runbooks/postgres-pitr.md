# Postgres PITR Recovery

## Objectives
- **RTO**: 30 minutes to resume service.
- **RPO**: 5 minutes of acceptable data loss.

## Preconditions
- WAL archives replicated to the `${SECONDARY_REGION}` bucket.
- Hourly automated snapshots available in the secondary region.
- Last nightly restore drill from `infra/pitr/helm` succeeded.

## Recovery Steps
1. Declare the incident and halt writes to the primary.
2. Promote the read replica or restore the latest snapshot:
   ```bash
   aws rds promote-read-replica --db-instance-identifier ${DB_REPLICA_ID} --region ${SECONDARY_REGION}
   ```
3. For corruption or lost writes, restore from snapshot and replay WAL:
   ```bash
   PG_SNAPSHOT_ID=<snapshot-id> SECONDARY_REGION=<region> \
   bash infra/disaster-recovery/tests/restore-backup.sh
   ```
4. Update application configuration to point to the restored endpoint.
5. Run smoke tests and resume traffic once healthy.

## Verification
- `restore-backup.metrics` reports `RTO_SECONDS <= 1800` and `RPO_SECONDS <= 300`.
- Replication lag dashboards stay under five minutes after promotion.

## Escalation
- PagerDuty: pokerhub-eng
- Slack: #ops
