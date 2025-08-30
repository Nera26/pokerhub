# Operations Runbooks

## Incident Response
1. Acknowledge alert in PagerDuty and notify the team in `#incidents`.
2. Triage using Grafana dashboards and Prometheus queries.
3. Mitigate user impact via rollback, scaling, or feature flags.
4. Communicate status every 15 minutes until resolved.
5. Document a postmortem within 48 hours.

## Error Budget Policy
- SLO: 99.9% quarterly availability (≈43 min downtime/month).
- >50% budget burn: pause new feature deployments.
- 100% budget burn: initiate reliability sprint and exec review.
