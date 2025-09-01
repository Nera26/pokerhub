Ops Preflight

The ops-preflight composite action centralizes operational gates used across deployment workflows. It verifies:

Spectator privacy scan freshness (spectator-privacy-nightly)

Soak metrics: SLA freshness and performance thresholds (p95 latency, min throughput) and trend artifacts presence

Disaster recovery drills: dr-drill, dr-failover, dr-restore, dr-throwaway

DR RTO/RPO trend targets: fails if latest or averages exceed RTO_TARGET / RPO_TARGET

Proof archive workflow freshness (proof-archive)

Inputs
Name	Required	Description
slack-channel-id	✅	Slack channel ID to receive SLA alerts.
spectator-privacy-sla-hours		Max age (hours) for spectator-privacy-nightly. Default: 24.
soak-metrics-sla-hours	✅	Max age (hours) for the soak/soak-metrics workflow artifacts.
dr-drill-sla-days	✅	Max age (days) for the last dr-drill run.
dr-failover-sla-days	✅	Max age (days) for the last dr-failover run.
dr-restore-sla-days	✅	Max age (days) for the last dr-restore run.
dr-throwaway-sla-days	✅	Max age (days) for the last dr-throwaway run.
proof-archive-sla-hours		Max age (hours) for the proof-archive workflow. Default: 24.

The action fails if required artifacts (e.g., soak-summary.json) are missing or if any thresholds are exceeded.

Required secrets & vars

Secrets

SLACK_BOT_TOKEN – used by check-workflow-sla to send alerts.

GCP_SA_KEY – service-account JSON used for DR metric checks (if the action reads Monitoring or GCS directly).

Repository / Environment Vars

vars.GCP_PROJECT_ID – GCP project containing DR metrics.

vars.DR_METRICS_BUCKET – GCS bucket holding DR drill metrics/trend files.

vars.RTO_TARGET – maximum allowed RTO in seconds (e.g., 1800).

vars.RPO_TARGET – maximum allowed RPO in seconds (e.g., 300).

vars.SOAK_TRENDS_BUCKET – GCS bucket for soak trend artifacts.

vars.SOAK_LATENCY_P95_MS – maximum allowed p95 latency for the latest soak (e.g., 120).

vars.SOAK_THROUGHPUT_MIN – minimum allowed throughput for the latest soak (e.g., 100).

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
          soak-metrics-sla-hours: 24
          dr-drill-sla-days: 7
          dr-failover-sla-days: 30
          dr-restore-sla-days: 30
          dr-throwaway-sla-days: 7
          proof-archive-sla-hours: 24