# RTO and RPO Procedures

Document the steps to meet recovery objectives during regional outages.

## Dashboard
- Grafana: [Disaster Recovery](../analytics-dashboards.md)

## Objectives
- **RTO**: 30 minutes to full service restoration.
- **RPO**: 5 minutes of acceptable data loss.

## RTO Procedure
1. Declare incident and initiate failover to the secondary region.
2. Promote the most recent Postgres snapshot and restore Redis from replication.
3. Update application configuration to point to promoted endpoints.
4. Run smoke tests and resume traffic once healthy.

## RPO Procedure
1. Ensure backups and WAL shipping complete every 5 minutes.
2. During recovery, replay WAL up to the latest timestamp available.
3. Verify data consistency against metrics and logs before reopening writes.

## Verification
- `infra/scripts/verify-backups.sh` shows latest snapshots in secondary region.
- `npx ts-node infra/disaster-recovery/tests/restore.test.ts` proves the latest snapshot is within the 5 minute RPO.
- Replication lag dashboards stay under 5 minutes after failover.

## Monthly Failover Drill
1. Run `infra/disaster-recovery/drill.sh` with appropriate environment variables to restore the latest snapshot in the secondary region.
2. Use `restore-latest.sh` if snapshot validation is required.
3. Review `drill.metrics` for `RTO_SECONDS` and `RPO_SECONDS`; target **RTO ≤ 1800s** and **RPO ≤ 300s**.
4. Raise a PagerDuty incident if thresholds are exceeded or scripts fail.

## PagerDuty Escalation
- Service: `pokerhub-eng`
- Slack: #ops
