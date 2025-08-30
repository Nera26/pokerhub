# Service Uptime

## Summary
Steps when service uptime SLO burn rate alerts fire:

## Dashboard
- Grafana: [Service Uptime](../analytics-dashboards.md)

## PagerDuty Escalation
- Service: `pokerhub-sre`

1. Check [status page](https://status.pokerhub.example.com).
2. Inspect Kubernetes health for `api` and `room-worker` deployments.
3. Roll back the most recent deployment if necessary.
4. Escalate to SRE lead if unresolved after 15 minutes.
