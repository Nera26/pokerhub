# Canary Deployment Runbook

Use this runbook to release a canary and watch its SLO health.

## Trigger

1. Go to **Actions → Canary Deploy** in GitHub.
2. Click **Run workflow**. It sends 5 % of traffic to `api-canary` for 30 minutes.

## Monitor

1. The workflow polls Prometheus each minute using `SLO_QUERY`.
2. If burn rate exceeds `SLO_BURN_THRESHOLD` it rolls back automatically and the job fails.
3. When the burn rate stays below the threshold for 30 minutes the canary is promoted to 100 %.

## Observability

- Watch the workflow logs and Prometheus/Grafana dashboards for errors or latency.
- Download the `k6-summary` artifact for load‑test details.
