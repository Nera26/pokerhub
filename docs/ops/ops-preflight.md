Ops Preflight

The ops-preflight composite action centralizes operational gates used across deployment workflows. It verifies:

### Spectator Privacy Compliance

All repository workflows must invoke the spectator-privacy reusable workflow (`uses: ./.github/workflows/spectator-privacy.yml`). The CI job `ensure-spectator-privacy` runs `scripts/ensure-spectator-privacy.ts` and exits non-zero if a workflow omits the job or lacks the `if: ${{ always() }}` guard.

Workflows that call `.github/workflows/soak.yml` or `.github/workflows/soak-metrics.yml` must include `if: ${{ always() }}` so soak metrics are published even when preceding jobs fail. The `scripts/ensure-soak-metrics.ts` check enforces this.

Spectator privacy

spectator-privacy-nightly workflow freshness

spectator_privacy/run_success metric freshness

Spectator retention

spectator-retention workflow freshness

Soak metrics

Workflow/artifact SLA freshness

Performance thresholds: p95 latency and minimum throughput

Stale soak metrics older than **soak-metrics-sla-hours** (24 h default) block releases. `scripts/check-soak-metrics.ts`
asserts the latest run meets **latency p95 ≤ 120 ms**, **throughput ≥ `SOAK_THROUGHPUT_MIN`**,
and **GC pause p95 ≤ 50 ms**.

Presence of trend artifacts

Disaster recovery drills

dr-drill, dr-failover, dr-restore, check-dr-runbook, dr-throwaway workflow freshness

Disaster recovery trends

Fails if latest or average RTO/RPO exceed RTO_TARGET / RPO_TARGET

Proof archive

proof-archive workflow freshness

Bucket retention and dual-region replication audits (fail deployment on breach)

If any gate fails, deployment is blocked.

Inputs
Name	Required	Description
slack-channel-id	✅	Slack channel ID to receive SLA alerts.
spectator-privacy-sla-hours		Max age (hours) for spectator-privacy-nightly and the spectator_privacy/run_success metric. Default: 24.
spectator-retention-sla-days	✅	Max age (days) for the spectator-retention workflow.
soak-metrics-sla-hours	✅	Max age (hours) for the soak / soak-metrics workflow artifacts.
dr-drill-sla-days	✅	Max age (days) for the last dr-drill run.
dr-failover-sla-days	✅	Max age (days) for the last dr-failover run.
dr-restore-sla-days	✅	Max age (days) for the last dr-restore run.
dr-runbook-sla-days       ✅      Max age (days) for the last check-dr-runbook run.
dr-throwaway-sla-days	✅	Max age (days) for the last dr-throwaway run.
proof-archive-sla-hours		Max age (hours) for the proof-archive workflow. Default: 24.

❗ The action fails if required artifacts (e.g., soak-summary.json) are missing or if thresholds are exceeded.

Required secrets & vars
Secrets

SLACK_BOT_TOKEN – used by check-workflow-sla
 to send alerts.

Repository / Environment Vars

vars.GCP_PROJECT_ID – GCP project containing DR & spectator privacy metrics.
vars.GCP_WORKLOAD_IDENTITY_PROVIDER – full resource name of the workload identity provider.
vars.GCP_SERVICE_ACCOUNT – email of the service account to impersonate.

vars.DR_METRICS_BUCKET – GCS bucket holding DR drill metrics / trend files.

vars.DR_METRICS_MIN_RETENTION_DAYS – minimum retention (days) for DR metrics bucket.

vars.RTO_TARGET – maximum allowed RTO in seconds (e.g., 1800).

vars.RPO_TARGET – maximum allowed RPO in seconds (e.g., 300).

vars.SOAK_TRENDS_BUCKET – GCS bucket for soak trend artifacts.

vars.SOAK_TRENDS_MIN_RETENTION_DAYS – minimum retention (days) for soak trends bucket.

vars.SOAK_LATENCY_P95_MS – max allowed p95 latency for the latest soak (e.g., 120).

vars.SOAK_THROUGHPUT_MIN – minimum allowed throughput for the latest soak (e.g., 100).

PROOF_ARCHIVE_BUCKET – GCS bucket to audit for proof archive retention & replication.

vars.SECONDARY_REGION – expected secondary region for proof archive replication.

Authentication uses Workload Identity Federation; no service-account JSON key is required. The service account must have permission to read Cloud Monitoring time-series data (e.g., roles/monitoring.viewer) and access GCS buckets for soak/DR/proof artifacts.

Behavior on failure

Posts a Slack message to slack-channel-id describing the failing check.

Exits non-zero to block downstream deploy/canary jobs.

Example usage
jobs:
  preflight:
    runs-on: ubuntu-latest
    steps:
      - uses: ./.github/actions/ops-preflight
        with:
          slack-channel-id: ${{ secrets.SLACK_CHANNEL_ID }}
          spectator-privacy-sla-hours: 24
          spectator-retention-sla-days: 1
          soak-metrics-sla-hours: 24
          dr-drill-sla-days: 7
          dr-failover-sla-days: 30
          dr-restore-sla-days: 30
          dr-runbook-sla-days: 7
          dr-throwaway-sla-days: 7
          proof-archive-sla-hours: 24