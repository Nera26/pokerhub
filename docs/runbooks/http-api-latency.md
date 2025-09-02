# Frontend Route Latency

Investigates slow Next.js route responses affecting players.

## Monitoring
- Grafana: [Frontend Route Latency](https://grafana.pokerhub.example/d/frontend-route-latency) (UID `frontend-route-latency`)
- Metabase: [Latency & Error Overview](https://metabase.pokerhub.example/dashboard/latency-error-overview)

## Alerting
- Route: [`pokerhub-eng`](../../metrics/alert-routes.md#pokerhub-eng) (PagerDuty ID: PENG012)
- Escalation: [Engineering](https://pokerhub.pagerduty.com/escalation_policies/PDEF456)
- Rule: `HttpApiLatencySLOViolation` in [alerts.yml](../../infra/observability/alerts.yml)

## Playbook
1. Compare latency spikes with recent deployments.
2. Check database and cache health for bottlenecks.
3. Roll back or scale API pods if latency persists.

Refer to [Error Budget Procedures](../error-budget-procedures.md) when alerts burn the budget.
