# Queue Lag

Investigates delays in processing queued actions.
 
## Dashboard
- Grafana: [Queue Lag](../../infrastructure/observability/queue-lag-dashboard.json)
- Metabase: [Queue Lag](../analytics-dashboards.md#queue-saturation-1)

## PagerDuty
- Service: `pokerhub-eng` (ID: PENG012) <!-- Update ID if PagerDuty service changes -->
- Escalation: [Engineering](https://pokerhub.pagerduty.com/escalation_policies/PDEF456)

## Playbook
1. Identify which queues show sustained lag.
2. Check room worker logs for consumer errors.
3. Scale consumers for the affected queue.
4. Purge dead-lettered messages if backlog persists.

Refer to [Error Budget Procedures](../error-budget-procedures.md) for escalation guidance.
