# WebSocket Latency

Investigates slow WebSocket message delivery or ACKs.

## Dashboard
- Grafana: [WebSocket Latency](../../infra/observability/websocket-latency-dashboard.json)
- Grafana: [WebSocket Queue](../../infra/observability/ws-outbound-queue-dashboard.json)

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

## Backpressure

The gateway enforces backpressure to protect itself from slow consumers:

- `ws_outbound_queue_depth` tracks pending messages per socket. Compare with
  `ws_outbound_queue_threshold` (warning) and `ws_outbound_queue_limit`
  (hard cap). Beyond the limit, frames are dropped and `ws_outbound_dropped_total`
  increments.
- `game_action_global_count` reports the aggregate action rate. When it exceeds
  `game_action_global_limit`, additional actions are rejected and
  `global_limit_exceeded` is incremented.

Sustained breaches indicate overloaded clients or abusive behavior. Throttle or
disconnect offending sessions and consider scaling out additional gateway
instances.

## CI Regression Check

The `socket-load` harness (`npm run perf:socket-load`) exercises WebSocket
actions at scale and enforces latency and throughput thresholds. CI publishes
the generated `metrics/` directory as an artifact. `scripts/check-backpressure.ts`
re-runs the harness and fails if `ws_outbound_queue_depth` exceeds 80 messages
or if the global action counters reach their configured limit.

Thresholds:

- p95 latency ≤120 ms per table
- actions/min ≥15 per table

Runs that exceed these limits exit non‑zero and should block deployment until
investigated. Backpressure failures reference the [Queue Saturation](queue-saturation.md)
runbook for mitigation steps.
