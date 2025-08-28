# Disaster Recovery Runbook

## Objectives
- **Recovery Time Objective (RTO)**: 30 minutes
- **Recovery Point Objective (RPO)**: 5 minutes

## Backup Strategy
- Nightly snapshots of Postgres and Redis are copied to `${SECONDARY_REGION}` and retained for 7 days to enable point-in-time recovery (PITR).
- Cross-region read replicas continuously replicate changes.
- Helm CronJobs run restore tests to validate snapshots.

## Recovery Steps
1. If the primary region is unavailable, promote the read replica:
   ```bash
   aws rds promote-read-replica \
     --db-instance-identifier ${DB_REPLICA_ID} \
     --region ${SECONDARY_REGION}
   ```
2. For data corruption, restore Postgres to a specific point in time:
   ```bash
   aws rds restore-db-instance-to-point-in-time \
     --source-db-instance-identifier ${DB_PRIMARY_ID} \
     --target-db-instance-identifier pg-dr-restore \
     --use-latest-restorable-time \
     --region ${SECONDARY_REGION}
   ```
3. Restore the Redis snapshot:
   ```bash
   aws elasticache restore-replication-group-from-snapshot \
     --replication-group-id redis-dr-restore \
     --snapshot-name redis-dr-snapshot \
     --region ${SECONDARY_REGION}
   ```
4. Update application configuration to point to the promoted or restored endpoints.
5. Verify application health before resuming traffic.

## Verification
- Run `infra/scripts/verify-backups.sh` to confirm snapshot availability.
- Monitor GitHub nightly workflow `backup-verify` for automated checks.
