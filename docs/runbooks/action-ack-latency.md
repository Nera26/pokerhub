# Action ACK Latency

Investigates slow acknowledgements of game actions.

## Monitoring
- Grafana: [Action ACK Latency](https://grafana.pokerhub.example/d/socket-latency) (UID `socket-latency`)
- Metabase: [Alerts Overview](https://metabase.pokerhub.example/dashboard/alerts-overview)

## Alerting
- Route: [`pokerhub-sre`](../../metrics/alert-routes.md#pokerhub-sre) (PagerDuty ID: PSRE789)
- Escalation: [SRE](https://pokerhub.pagerduty.com/escalation_policies/PABC123)
- Rule: `ActionAckLatencySLOViolation` in [alerts.yml](../../infrastructure/observability/alerts.yml)

## Playbook
1. Check if latency spikes correlate with deployments or incidents.
2. Inspect room worker logs for timeouts or backpressure.
3. Restart affected room workers.
4. Scale room worker deployment if saturation persists.

Consult [Error Budget Procedures](../error-budget-procedures.md) when burn alerts trigger.
