# Error Budget Procedures

When service level objectives burn their monthly error budget, operators follow these escalation rules.

PagerDuty routes SLO burn alerts based on the metric:

- `pokerhub-sre` – service uptime, action ACK latency, socket connect success, and request error rate.
- `pokerhub-eng` – queue saturation.

On-call engineers escalate to the engineering manager if burn rates stay high for more than an hour and involve the CTO once the full monthly budget is exhausted.

An example Prometheus burn-rate rule lives at [../infrastructure/observability/error-budgets.rules.yml](../infrastructure/observability/error-budgets.rules.yml) to illustrate alert configuration.

## Dashboards & Alert Thresholds
All SLOs use multi-window burn rates of **14.4×** (5 m/1 h) and **6×** (30 m/6 h). Dashboards live under `../infrastructure/observability/`:

| Metric | Grafana dashboard | PagerDuty service |
| --- | --- | --- |
| Service uptime | [Service Uptime](../infrastructure/observability/service-uptime-dashboard.json) | `pokerhub-sre` |
| Action ACK latency | [Socket Latency](../infrastructure/observability/socket-latency-dashboard.json) | `pokerhub-sre` |
| Socket connect success | [Socket Connects](../infrastructure/observability/socket-connects-dashboard.json) | `pokerhub-sre` |
| Request error rate | [Error Rates](../infrastructure/observability/error-rates-dashboard.json) | `pokerhub-sre` |
| Queue saturation | [Queue Lag](../infrastructure/observability/queue-lag-dashboard.json) | `pokerhub-eng` |

Refer to these runbooks for mitigation steps:

- [Action ACK Latency](runbooks/action-ack-latency.md)
- [Socket Connect Success](runbooks/socket-connect-success.md)
- [Error Rates](runbooks/error-rates.md)
- [Service Uptime](runbooks/service-uptime.md)
- [Queue Saturation](runbooks/queue-saturation.md)

## Breach Handling Workflow
1. **Observe** – An Alertmanager page for burn rate or SLO breach arrives via
   PagerDuty. Open the relevant Grafana dashboard from the table above.
2. **Mitigate** – Follow the linked runbook to stabilize the service. Record
   actions in the incident channel.
3. **Verify** – Ensure burn rate drops below thresholds on the dashboard. If it
   remains high for more than an hour, escalate to the engineering manager.
4. **Postmortem** – After resolution, document the incident and reference the
   dashboard snapshot in the report.

## 50% Budget Consumed
- Freeze feature deployments; only reliability fixes may ship.
- Review active incidents and prioritize mitigation work.
- Engineering manager approval is required for any production change.

## 100% Budget Consumed
- Roll back recent risky releases.
- Conduct an incident review and document corrective actions.
- No production changes proceed without engineering manager and CTO approval.

These procedures work in tandem with the thresholds defined in [SLOs.md](SLOs.md).
