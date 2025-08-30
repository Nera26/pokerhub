# Disaster Recovery Runbook

## Objectives
- **Recovery Time Objective (RTO)**: 30 minutes
- **Recovery Point Objective (RPO)**: 5 minutes

## Backup Strategy
- AWS Backup schedules hourly Postgres snapshots and copies them to `${SECONDARY_REGION}`.
- WAL segments are archived every 5 minutes to `s3://${WAL_ARCHIVE_BUCKET}` and replicated cross-region for PITR.
- Kubernetes CronJobs `pg-snapshot-replication` and `redis-snapshot-replication` copy Postgres and Redis snapshots to `${SECONDARY_REGION}`.
- A GCP Cloud Scheduler job triggers cross-cloud snapshot copies to `${SECONDARY_REGION}`.
- Cross-region read replicas continuously replicate changes.
- Kubernetes CronJobs `postgres-backup` and `redis-backup` upload encrypted archives to `s3://${ARCHIVE_BUCKET}`.

## Recovery Steps
1. If the primary region is unavailable, run the failover script to promote replicas and update DNS:
   ```bash
   SECONDARY_REGION=${SECONDARY_REGION} \
   PG_REPLICA_ID=${DB_REPLICA_ID} \
   REDIS_REPLICA_ID=${REDIS_REPLICA_ID} \
   ROUTE53_ZONE_ID=${ROUTE53_ZONE_ID} \
   DB_RECORD_NAME=db.example.com \
   REDIS_RECORD_NAME=redis.example.com \
   bash infra/disaster-recovery/failover.sh
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

## Latest Backup Restore

Use the automation under `infra/disaster-recovery` to spin up the most recent
snapshot and capture recovery metrics.

```bash
PG_PRIMARY_ID=<db-instance-id> \
PGUSER=<db-user> \
PGPASSWORD=<db-pass> \
SECONDARY_REGION=<aws-region> \
bash infra/disaster-recovery/restore-latest.sh
```

The script restores the newest snapshot into a temporary instance, verifies it
with `SELECT 1`, and writes `RPO_SECONDS` and `RTO_SECONDS` to
`infra/disaster-recovery/restore-latest.metrics`. Review the metrics to ensure
**RPO ≤ 5 min** and **RTO ≤ 30 min** before promoting the instance.

## Region Loss Drill

Run the region failover drill to restore the latest snapshot in the secondary
region and validate RTO/RPO.

```bash
PG_INSTANCE_ID=<db-instance-id> \
SECONDARY_REGION=<aws-region> \
PGUSER=<db-user> \
PGPASSWORD=<db-pass> \
WAL_ARCHIVE_BUCKET=<wal-archive-bucket> \
bash infra/disaster-recovery/drill.sh
```

The script writes `drill.metrics` containing `RTO_SECONDS` and `RPO_SECONDS`.
Confirm **RPO ≤ 300s** and **RTO ≤ 1800s**. Set `KEEP_INSTANCE=true` to retain
the restored instance for inspection.

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

## Automated Drill

The `dr-drill` GitHub Actions workflow runs weekly to spin up a standby
cluster in `${SECONDARY_REGION}` and measure time to service readiness.
It validates snapshot freshness and WAL shipping to ensure **RPO ≤ 5 min**
and **RTO ≤ 30 min**. Failures trigger a PagerDuty alert to `pokerhub-eng`.

### Recent Drill Results
- 2025-08-30: `drill.sh` failed locally because `aws` CLI was not available; RTO/RPO metrics were not captured. Install AWS CLI and configure credentials with `aws configure` before rerunning.

## Escalation
- PagerDuty: pokerhub-eng
- Slack: #ops

## Verification
- Run `infra/disaster-recovery/restore-latest.sh` to restore the most recent snapshot and generate `restore-latest.metrics` containing `RPO_SECONDS` and `RTO_SECONDS`.
- Run `infra/disaster-recovery/tests/restore-wal.sh` to validate WAL archive restores and measure `RTO_SECONDS` and `RPO_SECONDS`.
- Run `npx ts-node infra/disaster-recovery/tests/restore.test.ts` to spin up a snapshot in a sandbox and verify `RPO_SECONDS ≤ 300`.
- Monitor GitHub nightly workflow `backup-verify` for automated checks.
- Monitor GitHub nightly workflow `pitr-nightly` for PITR backup results.
- Monitor GitHub nightly workflow `restore-nightly` for nightly snapshot restore tests. Review the `restore.log` and `restore-backup.metrics` artifacts to confirm `RTO_SECONDS ≤ 1800` and `RPO_SECONDS ≤ 300`.
- Monitor GitHub nightly workflow `restore-latest` for automated restore drills of the most recent snapshot. Review the `restore-latest.log` and `restore-latest.metrics` artifacts to confirm `RTO_SECONDS ≤ 1800` and `RPO_SECONDS ≤ 300`.

### Data Verification Checklist
- [ ] Leaderboards rebuilt and show expected standings.
- [ ] Wallet balances restored for a sample of players.
- [ ] Hand logs available for recent games.
