# Socket Connect Success

Investigates failed WebSocket connection attempts.
 
## Monitoring
- Grafana: [Socket Connects](https://grafana.pokerhub.example/d/socket-connects) (UID `socket-connects`)
- Metabase: [Alerts Overview](https://metabase.pokerhub.example/dashboard/alerts-overview)

## Alerting
- Route: [`pokerhub-sre`](../../metrics/alert-routes.md#pokerhub-sre) (PagerDuty ID: PSRE789)
- Escalation: [SRE](https://pokerhub.pagerduty.com/escalation_policies/PABC123)

## Playbook
1. Check if failures correlate with recent deployments or network changes.
2. Inspect load balancer and backend logs for connection or handshake errors.
3. Roll back recent deployments if failures spiked after a release.
4. Scale out gateway or backend instances if resource limits are reached.
5. Verify TLS certificates and network ACLs.

Refer to [Error Budget Procedures](../error-budget-procedures.md) for burn handling.
