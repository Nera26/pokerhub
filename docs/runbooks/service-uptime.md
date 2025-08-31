# Service Uptime

Investigates downtime or availability dips.

## Monitoring
- Grafana: [Service Uptime](https://grafana.pokerhub.example/d/service-uptime) (UID `service-uptime`)
- Metabase: [Alerts Overview](https://metabase.pokerhub.example/dashboard/alerts-overview)

## Alerting
- Route: [`pokerhub-sre`](../../metrics/alert-routes.md#pokerhub-sre) (PagerDuty ID: PSRE789)
- Escalation: [SRE](https://pokerhub.pagerduty.com/escalation_policies/PABC123)
- Rule: `UptimeSLOViolation` in [alerts.yml](../../infra/observability/alerts.yml)

## Playbook
1. Check [status page](https://status.pokerhub.example.com).
2. Inspect Kubernetes health for `api` and `room-worker` deployments.
3. Roll back the most recent deployment if necessary.
4. Escalate to SRE lead if unresolved after 15 minutes.

Refer to [Error Budget Procedures](../error-budget-procedures.md) when availability threatens the budget.
