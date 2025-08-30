# Incident Response & On‑Call

This runbook defines how PokerHub handles production incidents and documents the on‑call rotation.

## Dashboard
- Grafana: [SLO Overview](../analytics-dashboards.md)

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

## PagerDuty Escalation
- Service: `pokerhub-sre`
