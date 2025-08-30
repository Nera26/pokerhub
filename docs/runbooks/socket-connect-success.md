# Socket Connect Success

Investigates failed WebSocket connection attempts.
 
## Dashboard
- Grafana: [Socket Connects](../../infrastructure/observability/socket-connects-dashboard.json)
- Metabase: [Socket Connect Success](../analytics-dashboards.md#socket-connect-success-1)

## PagerDuty Escalation
- Service: `pokerhub-sre`

See [SLO alert strategy](../SLOs.md) for burn-rate thresholds.

## When to page
Page when burn rates threaten the [SLO error budget](../SLOs.md#error-budget-handling).

## Triage
1. Check if failures correlate with recent deployments or network changes.
2. Inspect load balancer and backend logs for connection or handshake errors.

## Mitigation
- Roll back recent deployments if failures spiked after a release.
- Scale out gateway or backend instances if resource limits are reached.
- Verify TLS certificates and network ACLs.
