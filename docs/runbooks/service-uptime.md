# Service Uptime

Investigates downtime or availability dips.

## Dashboard
- Grafana: [Service Uptime](../../infrastructure/observability/service-uptime-dashboard.json)

## Alert Rule
- `UptimeSLOViolation` in [alerts.yml](../../infrastructure/observability/alerts.yml)

## PagerDuty
- Service: `pokerhub-sre` (ID: PSRE789) <!-- Update ID if PagerDuty service changes -->
- Escalation: [SRE](https://pokerhub.pagerduty.com/escalation_policies/PABC123)

## Playbook
1. Check [status page](https://status.pokerhub.example.com).
2. Inspect Kubernetes health for `api` and `room-worker` deployments.
3. Roll back the most recent deployment if necessary.
4. Escalate to SRE lead if unresolved after 15 minutes.

Refer to [Error Budget Procedures](../error-budget-procedures.md) when availability threatens the budget.
