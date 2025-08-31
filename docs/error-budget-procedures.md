# Error Budget Procedures

When service level objectives burn their monthly error budget, operators follow these escalation rules. Monthly budgets are derived from `1 - target` for each SLO (e.g. 99.95% availability leaves **21.6 minutes** per month).

## Procedure Summary
1. **Alert** – Burn‑rate rules page the owning PagerDuty service.
2. **Mitigate** – Follow the linked runbook to stabilize the service.
3. **Freeze** – At **50%** budget consumed pause feature deployments.
4. **Rollback** – At **100%** budget consumed revert risky releases and require engineering manager and CTO approval.

If burn rates exceed **14.4×** over 1 h or **6×** over 6 h, PagerDuty pages the owning team. Consuming **50%** of the monthly budget freezes feature deployments until stability returns. Exhausting **100%** requires rolling back risky releases and mandates engineering manager and CTO approval for any production change.

PagerDuty routes SLO burn alerts based on the metric:

- `pokerhub-sre` – service uptime, action ACK latency, socket connect success, and request error rate.
- `pokerhub-eng` – queue saturation.

On-call engineers escalate to the engineering manager if burn rates stay high for more than an hour and involve the CTO once the full monthly budget is exhausted.

An example Prometheus burn-rate rule lives at [../infrastructure/observability/error-budgets.rules.yml](../infrastructure/observability/error-budgets.rules.yml) to illustrate alert configuration.

## Burn Rate Calculation

The burn rate measures how quickly the service consumes its error budget. For an SLO target `S`, the permitted error rate is `E = 1 - S`.

```
burn_rate = observed_error_rate / E
time_to_exhaust_hours = (30 * 24) / burn_rate
```

A 99.9% availability SLO allows 0.1% errors (43.2 minutes per month). If the observed error rate reaches 5%, the burn rate is `0.05 / 0.001 = 50`, exhausting the monthly budget in roughly `14.4` hours. Multi-window alerts fire when burn rates exceed **14.4×** over 1 h or **6×** over 6 h.

## Dashboards & Alert Thresholds
All SLOs use multi-window burn rates of **14.4×** (5 m/1 h) and **6×** (30 m/6 h). Dashboards live under `../infrastructure/observability/`:

| Metric | Grafana UID | PagerDuty service | PagerDuty policy | Runbook |
| --- | --- | --- | --- | --- |
| Service uptime | [service-uptime](https://grafana.pokerhub.example/d/service-uptime) | `pokerhub-sre` | [SRE](https://pokerhub.pagerduty.com/escalation_policies/PABC123) | [Service Uptime](runbooks/service-uptime.md) |
| Action ACK latency | [socket-latency](https://grafana.pokerhub.example/d/socket-latency) | `pokerhub-sre` | [SRE](https://pokerhub.pagerduty.com/escalation_policies/PABC123) | [Action ACK Latency](runbooks/action-ack-latency.md) |
| Socket connect success | [socket-connects](https://grafana.pokerhub.example/d/socket-connects) | `pokerhub-sre` | [SRE](https://pokerhub.pagerduty.com/escalation_policies/PABC123) | [Socket Connect Success](runbooks/socket-connect-success.md) |
| Request error rate | [error-rates](https://grafana.pokerhub.example/d/error-rates) | `pokerhub-sre` | [SRE](https://pokerhub.pagerduty.com/escalation_policies/PABC123) | [Error Rates](runbooks/error-rates.md) |
| Queue saturation | [queue-saturation](https://grafana.pokerhub.example/d/queue-saturation) | `pokerhub-eng` | [Engineering](https://pokerhub.pagerduty.com/escalation_policies/PDEF456) | [Queue Saturation](runbooks/queue-saturation.md) |

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
