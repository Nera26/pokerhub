# Deployment Runbook
<!-- Update service IDs in this file if PagerDuty services change -->

Use this runbook to roll out a new release using a guarded canary.

## Prerequisites

- Set `ELASTIC_URL` and `LOKI_URL` to the logging endpoints. The backend refuses to
  start if neither is configured.

## Dashboard
- Grafana: [Action ACK Latency](../analytics-dashboards.md#action-ack-latency)
- Grafana: [Error Rate](../analytics-dashboards.md#error-rate)

## PagerDuty Escalation
- Service: `pokerhub-sre` (ID: PSRE789)

## Trigger

1. Go to **Actions → Deploy** in GitHub.
2. Click **Run workflow**. It ships the release to `api-canary` and routes 5 % of traffic for 30 minutes.

## Monitor

1. The workflow polls Prometheus each minute for `game_action_ack_latency_ms` p95 and HTTP error rate.
2. If latency rises above 120 ms or errors exceed 0.05 % (configurable via `$ERROR_RATE_THRESHOLD`), `scripts/rollback.sh` rolls back the canary and the workflow fails.
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

## Database migrations

Run pending TypeORM migrations before promoting the release:

```bash
npm run migration:run --prefix backend
```

If a rollback is required, revert the last migration:

```bash
npx typeorm-ts-node-commonjs migration:revert -d backend/src/database/data-source.ts
```
