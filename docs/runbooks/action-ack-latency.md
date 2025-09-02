# Action ACK Latency

Investigates slow acknowledgements of game actions.

## Monitoring
- Grafana: [Action ACK Latency](https://grafana.pokerhub.example/d/socket-latency) (UID `socket-latency`)
- Metabase: [Alerts Overview](https://metabase.pokerhub.example/dashboard/alerts-overview)
- Prometheus metrics:
  - `game_action_ack_latency_ms` histogram of ACK round-trip times
  - `actions_per_min` gauge for per-table throughput

## Thresholds
- p50 ACK latency ≤ 40 ms (`ACK_P50_MS`)
- p95 ACK latency ≤ 120 ms (`ACK_P95_MS`)
- p99 ACK latency ≤ 200 ms (`ACK_P99_MS`)
- Avg actions per table per minute ≥ 150 (`TPS_LIMIT`)

## Detection
- Rising ACK latency percentiles above the thresholds
- Throughput dropping below 150 actions/min per table

## Alerting
- Route: [`pokerhub-sre`](../../metrics/alert-routes.md#pokerhub-sre) (PagerDuty ID: PSRE789)
- Escalation: [SRE](https://pokerhub.pagerduty.com/escalation_policies/PABC123)
- Rule: `ActionAckLatencySLOViolation` in [alerts.yml](../../infra/observability/alerts.yml)

## CI Regression Check
`tests/performance/socket-load.ts` generates latency metrics and
`scripts/check-latency.ts` fails when the thresholds are breached. The job
reads `metrics/ws-latency.json` and honours `LATENCY_P50_MS`,
`LATENCY_P95_MS`, `LATENCY_P99_MS`, and `THROUGHPUT_MIN` environment
variables.

## Playbook
1. Check if latency spikes correlate with deployments or incidents.
2. Inspect room worker logs for timeouts or backpressure.
3. Restart affected room workers.
4. Scale room worker deployment if saturation persists.

Consult [Error Budget Procedures](../error-budget-procedures.md) when burn alerts trigger.
