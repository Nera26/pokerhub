# Action ACK Latency

Investigates slow acknowledgements of game actions.

- [Grafana Dashboard](../../infrastructure/monitoring/grafana-action-ack-latency.json)
- See [SLO alert strategy](../SLOs.md) for burn-rate thresholds.

## Triage
1. Check if latency spikes correlate with deployments or incidents.
2. Inspect room worker logs for timeouts or backpressure.

## Mitigation
- Restart affected room workers.
- Scale room worker deployment if saturation persists.
