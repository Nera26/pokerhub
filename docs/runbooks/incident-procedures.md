# Incident Response & On‑Call

This runbook defines how PokerHub handles production incidents and documents the on‑call rotation.

## Dashboards
- [SLO Overview](../analytics-dashboards.md)
- [Alerts Overview (Grafana)](../../infrastructure/observability/alerts-overview-grafana.json)
- [Alerts Overview (Metabase)](../../infrastructure/observability/alerts-overview-metabase.json)

## On‑Call Rotation
- **Primary**: rotates weekly across the SRE team and receives pages on the `pokerhub-sre` PagerDuty service.
- **Secondary**: engineering manager, notified if the primary does not acknowledge within 15 minutes.
- **Tertiary**: CTO, paged after 30 minutes or for P1 incidents.

## Response Steps
1. **Acknowledge** the alert in PagerDuty.
2. **Triage** using Grafana dashboards and relevant runbooks.
3. **Mitigate** the issue or roll back the offending change.
4. **Communicate** status updates in `#pokerhub-incident`.
5. **Post‑mortem**: create an incident report within 5 business days.

Error budgets from [../SLOs.md](../SLOs.md) drive page urgency; exhausting 50% of a monthly budget triggers a feature freeze, while 100% requires CTO approval for production changes.

See [error-budget-policy.md](error-budget-policy.md) for detailed freeze and rollback rules.


## PagerDuty Escalation
- Service: `pokerhub-sre` for platform issues
- Service: `pokerhub-eng` for frontend route latency and error alerts

### Examples
- `UptimeSLOViolation` firing on the [Alerts Overview dashboard](../../infrastructure/observability/alerts-overview-grafana.json) → page `pokerhub-sre`
- `Queue saturation` alert on the same dashboard → page `pokerhub-eng`

### On-Call Escalation Examples
- Primary does not acknowledge within 15 minutes → PagerDuty auto-escalates to the engineering manager.
- Continued paging for 30 minutes or a declared P1 incident → escalate to the CTO and begin incident bridge.
- Security breach indicators → notify the security officer and follow [security-breach.md](security-breach.md).

## Security References

- [../security/stride-summary.md](../security/stride-summary.md)
- [../security/kyc-aml-flow.md](../security/kyc-aml-flow.md)
- [../security/anti-collusion.md](../security/anti-collusion.md)

