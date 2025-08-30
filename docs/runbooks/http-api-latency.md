# HTTP API Latency

Investigates high HTTP API response times affecting players.

## Dashboard
- Grafana: [HTTP API Latency](../../infrastructure/observability/http-api-latency-dashboard.json)

## PagerDuty
- Service: `pokerhub-sre` (ID: PSRE123)
- Escalation: [SRE](https://pokerhub.pagerduty.com/escalation_policies/PABC123)

## Playbook
1. Compare latency spikes with recent deployments.
2. Check database and cache health for bottlenecks.
3. Roll back or scale API pods if latency persists.

Refer to [Error Budget Procedures](../error-budget-procedures.md) when alerts burn the budget.
