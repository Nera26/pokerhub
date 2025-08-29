# Deployment Runbook

Use this runbook to roll out a new release using a guarded canary.

## Trigger

1. Go to **Actions → Deploy** in GitHub.
2. Click **Run workflow**. It ships the release to `api-canary` and routes 5 % of traffic for 30 minutes.

## Monitor

1. The workflow polls Prometheus each minute for `game_action_ack_latency_ms` p95 and HTTP error rate.
2. If latency rises above 120 ms or errors exceed 0.05 % (per [slo.md](../slo.md)), the script triggers `helm rollback` and the workflow fails.
3. When both metrics stay within SLO for the full window, the canary is promoted to 100 %.

## Observability

- Watch workflow logs and Grafana dashboards for latency or errors.
- Download the `k6-summary` artifact for additional load details.

## Manual override

Automated rollback uses `helm rollback` when SLOs are breached. To intervene manually:

1. Inspect revisions:
   ```bash
   helm history canary
   ```
2. Roll back to a specific revision if required:
   ```bash
   helm rollback canary <REVISION>
   ```
3. Adjust traffic by editing the VirtualService:
   ```bash
   kubectl -n "$NAMESPACE" edit virtualservice api
   ```
4. Releases are annotated with `pokerhub.io/release: <release>-<revision>` for traceability.
