# Action ACK Latency

Investigates slow acknowledgements of game actions.

## Dashboard
- Grafana: [Action ACK Latency](../../infrastructure/observability/socket-latency-dashboard.json)
- Metabase: [Action ACK Latency](../analytics-dashboards.md#action-ack-latency-1)

## Alert Rule
- `ActionAckLatencySLOViolation` in [alerts.yml](../../infrastructure/observability/alerts.yml)

## PagerDuty
- Service: `pokerhub-sre` (ID: PSRE789) <!-- Update ID if PagerDuty service changes -->
- Escalation: [SRE](https://pokerhub.pagerduty.com/escalation_policies/PABC123)

## Playbook
1. Check if latency spikes correlate with deployments or incidents.
2. Inspect room worker logs for timeouts or backpressure.
3. Restart affected room workers.
4. Scale room worker deployment if saturation persists.

Consult [Error Budget Procedures](../error-budget-procedures.md) when burn alerts trigger.
