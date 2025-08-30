# GC Pauses

Investigate long garbage collection pauses that impact gameplay responsiveness.

## Dashboard
- Grafana: [GC Pauses](../../infrastructure/observability/gc-pauses-dashboard.json)

## PagerDuty Escalation
- Service: `pokerhub-eng`

## Triage
1. Check room worker memory usage and recent deployments.
2. Capture heap profiles if pauses exceed baseline.
3. Roll back suspect changes and recycle pods if necessary.
