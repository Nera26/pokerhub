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
3. Restore ClickHouse from replicated backup:
   ```bash
   aws s3 sync s3://${CLICKHOUSE_BACKUP_BUCKET}-dr/ /var/lib/clickhouse/backup \
     --region ${SECONDARY_REGION}
   clickhouse-backup restore --config /etc/clickhouse-backup.yaml latest
   ```
4. Restore the Redis snapshot:
   ```bash
   aws elasticache restore-replication-group-from-snapshot \
     --replication-group-id redis-dr-restore \
     --snapshot-name redis-dr-snapshot \
     --region ${SECONDARY_REGION}
   ```
5. Update application configuration to point to the promoted or restored endpoints.
6. Verify application health before resuming traffic.

## Failover Simulation

Run the automated failover drill to measure restore time and data loss.

```bash
PG_SNAPSHOT_ID=<snapshot-id> \
CLICKHOUSE_SNAPSHOT=<snapshot-file> \
SECONDARY_REGION=<region> \
bash infra/disaster-recovery/tests/failover.sh
```

The script logs metrics and writes `failover.metrics` containing
`RTO_SECONDS` and `RPO_SECONDS` for tracking.

## Verification
- Run `infra/scripts/verify-backups.sh` to confirm snapshot availability.
- Monitor GitHub nightly workflow `backup-verify` for automated checks.
- Monitor GitHub nightly workflow `pitr-nightly` for PITR backup results.
