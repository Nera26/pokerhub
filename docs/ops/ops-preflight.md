# Ops Preflight

The `ops-preflight` composite action centralizes operational gates used across deployment workflows. It verifies:

- Spectator privacy scan and metric freshness
- Soak metric SLA
- Disaster recovery drills (dr-drill, dr-failover, dr-restore, dr-throwaway)
- Proof archive workflow freshness

## Inputs

| Name | Description |
| --- | --- |
| `slack-channel-id` | Slack channel ID to receive SLA alerts. |
| `spectator-privacy-sla-hours` | Optional. Maximum age in hours for `spectator-privacy-nightly` and the `spectator_privacy/run_success` metric. Defaults to `24`. |
| `soak-metrics-sla-hours` | Maximum age in hours for the `soak-metrics` workflow. |
| `dr-drill-sla-days` | Maximum age in days for the last `dr-drill` run. |
| `dr-failover-sla-days` | Maximum age in days for the last `dr-failover` run. |
| `dr-restore-sla-days` | Maximum age in days for the last `dr-restore` run. |
| `dr-throwaway-sla-days` | Maximum age in days for the last `dr-throwaway` run. |
| `proof-archive-sla-hours` | Optional. Maximum age in hours for the `proof-archive` workflow. Defaults to `24`. |

## Required Secrets and Vars

- `SLACK_BOT_TOKEN` – used by [`check-workflow-sla`](../../.github/workflows/check-workflow-sla/action.yml) to send alerts.
- `GCP_SA_KEY` – service account JSON for DR drill and spectator privacy metric checks.
- `vars.GCP_PROJECT_ID` – project containing DR and spectator privacy metrics.

The service account must have permission to read Cloud Monitoring time-series data (e.g., `roles/monitoring.viewer`).

Callers must also pass a `slack-channel-id` input when invoking the action.
