# Error Budget Procedures

When service level objectives burn their monthly error budget, operators follow these escalation rules.

PagerDuty routes SLO burn alerts based on the metric:

- `pokerhub-sre` – service uptime, action ACK latency, socket connect success, and request error rate.
- `pokerhub-eng` – queue saturation.

On-call engineers escalate to the engineering manager if burn rates stay high for more than an hour and involve the CTO once the full monthly budget is exhausted.

Refer to these runbooks for mitigation steps:

- [Action ACK Latency](runbooks/action-ack-latency.md)
- [Socket Connect Success](runbooks/socket-connect-success.md)
- [Error Rates](runbooks/error-rates.md)
- [Service Uptime](runbooks/service-uptime.md)
- [Queue Saturation](runbooks/queue-saturation.md)

## 50% Budget Consumed
- Freeze feature deployments; only reliability fixes may ship.
- Review active incidents and prioritize mitigation work.
- Engineering manager approval is required for any production change.

## 100% Budget Consumed
- Roll back recent risky releases.
- Conduct an incident review and document corrective actions.
- No production changes proceed without engineering manager and CTO approval.

These procedures work in tandem with the thresholds defined in [SLOs.md](SLOs.md).
