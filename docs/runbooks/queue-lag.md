# Queue Lag

Investigates delays in processing queued actions.
 
## Dashboard
- Grafana: [Queue Lag](../../infrastructure/monitoring/grafana-queue-lag.json)
- Metabase: [Queue Lag](../analytics-dashboards.md#queue-saturation-1)

## PagerDuty Escalation
- Service: `pokerhub-eng`

## Triage
1. Identify which queues show sustained lag.
2. Check room worker logs for consumer errors.

## Mitigation
- Scale consumers for the affected queue.
- Purge dead-lettered messages if backlog persists.
