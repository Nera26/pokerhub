# GC Pauses

Investigate long garbage collection pauses that impact gameplay responsiveness.

## Dashboard
- Grafana: [GC Pauses](../../infra/observability/gc-pauses-dashboard.json)

## PagerDuty
- Service: `pokerhub-eng` (ID: PENG012) <!-- Update ID if PagerDuty service changes -->
- Escalation: [Engineering](https://pokerhub.pagerduty.com/escalation_policies/PDEF456)

## Playbook
1. Check room worker memory usage and recent deployments.
2. Capture heap profiles if pauses exceed baseline.
3. Roll back suspect changes and recycle pods if necessary.

Refer to [Error Budget Procedures](../error-budget-procedures.md) when GC pauses risk budget exhaustion.
