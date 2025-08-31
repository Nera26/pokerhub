# Disaster Recovery Runbook
<!-- Update service IDs in this file if PagerDuty services change -->

## Dashboard
- Grafana: [Disaster Recovery](../analytics-dashboards.md)

## Objectives
- **Recovery Time Objective (RTO)**: 30 minutes
- **Recovery Point Objective (RPO)**: 5 minutes

## Backup Strategy
- Cloud SQL schedules hourly Postgres snapshots and copies them to `${SECONDARY_REGION}`.
- WAL segments are archived every 5 minutes to `gs://${WAL_ARCHIVE_BUCKET}` and replicated cross-region for PITR.
- Kubernetes CronJobs `pg-snapshot-replication`, `redis-snapshot-replication`, and `clickhouse-snapshot-replication` use `gcloud`/`gsutil` to copy Cloud SQL, Memorystore, and Cloud Storage backups to `${SECONDARY_REGION}`. Set `PG_INSTANCE_ID`, `REDIS_INSTANCE_ID`, and `BACKUP_BUCKET` accordingly.
- A Cloud Scheduler job triggers cross-cloud snapshot copies to `${SECONDARY_REGION}`.
- Cross-region read replicas continuously replicate changes.
- Kubernetes CronJobs `postgres-backup` and `redis-backup` upload encrypted archives to `gs://${ARCHIVE_BUCKET}`.

## Recovery Steps
1. If the primary region is unavailable, run the failover script to promote replicas and update DNS:
   ```bash
   SECONDARY_REGION=${SECONDARY_REGION} \
   SQL_REPLICA_INSTANCE=${SQL_REPLICA_INSTANCE} \
   MEMORYSTORE_INSTANCE=${MEMORYSTORE_INSTANCE} \
   CLOUD_DNS_ZONE=${CLOUD_DNS_ZONE} \
   DB_RECORD_NAME=db.example.com \
   REDIS_RECORD_NAME=redis.example.com \
   PROJECT_ID=${PROJECT_ID} \
   bash infra/disaster-recovery/failover.sh
   ```
2. For data corruption, restore Postgres to a specific point in time:
   ```bash
   gcloud beta sql instances restore-pitr pg-dr-restore \
     --restore-instance=${DB_PRIMARY_ID} \
     --point-in-time=latest \
     --project=${PROJECT_ID}
   ```
3. Restore ClickHouse from replicated backup:
   ```bash
   gsutil -m rsync gs://${CLICKHOUSE_BACKUP_BUCKET}-dr/ /var/lib/clickhouse/backup
   clickhouse-backup restore --config /etc/clickhouse-backup.yaml latest
   ```
4. Restore the Redis snapshot:
   ```bash
   gcloud redis instances import redis-dr-restore \
     --region ${SECONDARY_REGION} \
     --input-uri=gs://redis-dr-snapshot.rdb
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
SECONDARY_REGION=<gcp-region> \
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
SECONDARY_REGION=<gcp-region> \
PGUSER=<db-user> \
PGPASSWORD=<db-pass> \
WAL_ARCHIVE_BUCKET=<wal-archive-bucket> \
bash infra/disaster-recovery/drill.sh
```

The script writes `drill.metrics` containing `RTO_SECONDS` and `RPO_SECONDS`. Metrics are archived to `gs://dr-metrics/{run_id}/drill.metrics` and linked below.
Confirm **RPO ≤ 300s** and **RTO ≤ 1800s**. Set `KEEP_INSTANCE=true` to retain
the restored instance for inspection.

## Failover Simulation

Run the automated failover drill to measure restore time and data loss.

```bash
PG_BACKUP_ID=<backup-id> \
CLICKHOUSE_SNAPSHOT=<snapshot-file> \
SECONDARY_REGION=<region> \
PROJECT_ID=<project-id> \
bash infra/disaster-recovery/tests/failover.sh
```

The script logs metrics and writes `failover.metrics` containing
`RTO_SECONDS` and `RPO_SECONDS` for tracking. Metrics are archived to `gs://dr-metrics/{run_id}/dr-failover.metrics` and linked below.

## Automated Drill

The `dr-drill` GitHub Actions workflow runs weekly to spin up a standby
cluster in `${SECONDARY_REGION}` and measure time to service readiness.
It validates snapshot freshness and WAL shipping to ensure **RPO ≤ 5 min**
and **RTO ≤ 30 min**. Failures trigger a PagerDuty alert to `pokerhub-eng` (ID: PENG012).

The `failover-drill` workflow exercises a full regional failover and must
succeed at least once every 7 days. The `workflow-sla` CI job checks the
latest run and fails if it is older than 7 days or the run did not
complete successfully.
If the workflow fails, an issue is automatically created with the contents of
`drill.metrics`. Resolve the issue by:

1. Reviewing the metrics to see which objective was exceeded.
2. Rerunning `infra/disaster-recovery/drill.sh` to reproduce and isolate the fault.
3. Fixing any underlying infrastructure or configuration problems.
4. Closing the issue once the drill succeeds within targets.

### DR Trend Metrics

- The `dr-trends` job in `ci.yml` aggregates RTO/RPO results from recent drills
  and uploads a `dr-trends.json` artifact on every PR.
- `dr-trends.json` contains `latest`, `average`, and `trend` sections for
  `rto`, `rpoSnap`, and `rpoWal` (all in seconds).
- The job fails if any value exceeds **RTO > 1800s** or **RPO > 300s**, blocking
  merges until metrics are within objectives.

To inspect the metrics:

1. Open the PR's **dr-trends** workflow job and download the `dr-trends` artifact.
2. Review `dr-trends.json`:
   - `latest` shows the most recent drill's measurements.
   - `average` is the mean across all recorded drills.
   - `trend` is the difference between the latest values and the previous average.
3. If `latest` or `average` values exceed objectives, run
   `infra/disaster-recovery/drill.sh` to reproduce and address the regression
   before merging.

### Recent Drill Results
<!-- DR_DRILL_RESULTS -->
- 2025-08-30: `drill.sh` failed locally because `gcloud` CLI was not available; RTO/RPO metrics were not captured. Install the Google Cloud CLI and configure credentials before rerunning.

### Recent Failover Results
<!-- DR_FAILOVER_RESULTS -->

## PagerDuty Escalation
- Service: `pokerhub-eng` (ID: PENG012) <!-- Update ID if PagerDuty service changes -->
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
