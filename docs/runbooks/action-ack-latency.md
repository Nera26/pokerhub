# Action ACK Latency

Investigates slow acknowledgements of game actions.

## Dashboard
- Grafana: [Action ACK Latency](../../infrastructure/monitoring/grafana-action-ack-latency.json)
- Metabase: [Action ACK Latency](../analytics-dashboards.md#action-ack-latency-1)

## PagerDuty Escalation
- Service: `pokerhub-sre`

See [SLO alert strategy](../SLOs.md) for burn-rate thresholds.

## When to page
Page the on-call when burn-rate alerts consume more than the allowed [SLO error budget](../SLOs.md#error-budget-handling).

## Triage
1. Check if latency spikes correlate with deployments or incidents.
2. Inspect room worker logs for timeouts or backpressure.

## Mitigation
- Restart affected room workers.
- Scale room worker deployment if saturation persists.
