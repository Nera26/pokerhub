# WebSocket Latency

Investigates slow WebSocket message delivery or ACKs.

## Dashboard
- Grafana: [WebSocket Latency](../../infrastructure/observability/websocket-latency-dashboard.json)

## PagerDuty
- Service: `pokerhub-sre` (ID: PSRE789) <!-- Update ID if PagerDuty service changes -->
- Escalation: [SRE](https://pokerhub.pagerduty.com/escalation_policies/PABC123)

## Playbook
1. Inspect gateway and socket server metrics for packet loss or backpressure.
2. Verify network paths and load balancer health.
3. Restart or scale socket servers if latency remains high.

Refer to [Error Budget Procedures](../error-budget-procedures.md) when burn alerts trigger.
