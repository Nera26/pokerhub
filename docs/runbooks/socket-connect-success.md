# Socket Connect Success

Investigates failed WebSocket connection attempts.
 
## Dashboard
- Grafana: [Socket Connects](../../infrastructure/observability/socket-connects-dashboard.json)
- Metabase: [Socket Connect Success](../analytics-dashboards.md#socket-connect-success-1)

## PagerDuty
- Service: `pokerhub-sre` (ID: PSRE789) <!-- Update ID if PagerDuty service changes -->
- Escalation: [SRE](https://pokerhub.pagerduty.com/escalation_policies/PABC123)

## Playbook
1. Check if failures correlate with recent deployments or network changes.
2. Inspect load balancer and backend logs for connection or handshake errors.
3. Roll back recent deployments if failures spiked after a release.
4. Scale out gateway or backend instances if resource limits are reached.
5. Verify TLS certificates and network ACLs.

Refer to [Error Budget Procedures](../error-budget-procedures.md) for burn handling.
