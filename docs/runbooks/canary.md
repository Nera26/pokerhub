# Canary Deployment Runbook

Use this runbook to release a canary and watch its SLO health.

## Trigger

1. Go to **Actions → Canary Deploy** in GitHub.
2. Click **Run workflow**. It deploys using the Helm chart in `infra/canary` and sends 5 % of traffic to `api-canary` for 30 minutes.
3. A Helm hook runs `infra/canary/rollback.sh` after each upgrade. The script queries 1 h and 6 h burn‑rate metrics and fails the release if either exceeds its threshold.

## Monitor

1. The workflow polls Prometheus each minute using `SLO_QUERY` for p95 action ACK latency and overall error rates.
2. If burn rate exceeds `SLO_BURN_THRESHOLD` it rolls back automatically and the job fails.
3. When the burn rate stays below the threshold for 30 minutes the canary is promoted to 100 %.

## Alert-driven rollback

A Prometheus rule (`canary-burn-rate`) triggers when `game_action_ack_latency_error_budget` or overall error budget burn rate exceeds thresholds. Alertmanager sends both a PagerDuty incident and a `repository_dispatch` webhook (`canary-burn`) to GitHub, kicking off the `canary-rollback` workflow. The workflow runs `infra/canary/rollback.sh` and rolls back the `canary` release if the script reports a breach.

## Observability

- Watch the workflow logs and Prometheus/Grafana dashboards for errors or latency.
- Download the `k6-summary` artifact for load‑test details.

## Manual override

Automated rollback uses `helm rollback` when the burn rate breaches the SLO defined in `docs/slo.md`. To override manually:

1. Inspect recent revisions:
   ```bash
   helm history canary
   ```
2. Roll back to a specific revision if required:
   ```bash
   helm rollback canary <REVISION>
   ```
3. To adjust traffic manually, edit the VirtualService:
   ```bash
   kubectl -n "$NAMESPACE" edit virtualservice api
   ```
4. Each rollout is annotated with `pokerhub.io/release: <release>-<revision>` for traceability.
5. To bypass the burn‑rate gate, set `burnRate.skip=true` on the Helm command or export `SKIP_BURN_CHECK=true` when running the hook.
