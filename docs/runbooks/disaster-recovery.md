# Disaster Recovery Runbook

## Objectives
- **RTO**: 30 minutes
- **RPO**: 5 minutes

## Backup Strategy
- Nightly snapshots of Postgres and Redis are copied to `${SECONDARY_REGION}`.
- Helm CronJobs run restore tests to validate snapshots.

## Failover Steps
1. Promote the most recent Postgres snapshot in the secondary region:
   ```bash
   aws rds restore-db-instance-from-db-snapshot \
     --db-snapshot-identifier pg-dr-snapshot-copy \
     --db-instance-identifier pg-dr-restore \
     --region ${SECONDARY_REGION}
   ```
2. Restore the Redis snapshot:
   ```bash
   aws elasticache restore-replication-group-from-snapshot \
     --replication-group-id redis-dr-restore \
     --snapshot-name redis-dr-snapshot \
     --region ${SECONDARY_REGION}
   ```
3. Update application configuration to point to the restored endpoints.
4. Verify application health before resuming traffic.

## Verification
- Run `infra/scripts/verify-backups.sh` to confirm snapshot availability.
- Monitor GitHub nightly workflow `backup-verify` for automated checks.
