# WebSocket Latency

Investigates slow WebSocket message delivery or ACKs.

## Dashboard
- Grafana: [WebSocket Latency](../../infra/observability/websocket-latency-dashboard.json)

## Alert Rule
- `WebSocketLatencySLOViolation` in [alerts.yml](../../infra/observability/alerts.yml)

## PagerDuty
- Service: `pokerhub-sre` (ID: PSRE789) <!-- Update ID if PagerDuty service changes -->
- Escalation: [SRE](https://pokerhub.pagerduty.com/escalation_policies/PABC123)

## Playbook
1. Inspect gateway and socket server metrics for packet loss or backpressure.
2. Verify network paths and load balancer health.
3. Restart or scale socket servers if latency remains high.

Refer to [Error Budget Procedures](../error-budget-procedures.md) when burn alerts trigger.

## CI Regression Check

The `socket-load` harness (`npm run perf:socket-load`) exercises WebSocket
actions at scale and enforces latency and throughput thresholds. CI publishes
the generated `metrics/` directory as an artifact.

Thresholds:

- p95 latency ≤120 ms per table
- actions/min ≥15 per table

Runs that exceed these limits exit non‑zero and should block deployment until
investigated.
