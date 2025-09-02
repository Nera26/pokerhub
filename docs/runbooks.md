# Runbooks

See the [GCP Ops Runbook](gcp-ops-runbook.md) for disaster recovery, spectator privacy, soak metrics, and proof archive restoration procedures.

## PagerDuty Alert Policies
- **Telemetry pipeline**: see `infra/observability/pagerduty-telemetry.yml` for SLO burn-rate alerts.
- **Service burn rate**: `infra/observability/pagerduty-burn-rate.yml` covers core availability SLOs.
- **Log error volume**: `infra/observability/pagerduty-log-errors.yml` pages on sustained error logs.

## Escalation Paths
1. Primary on-call (PagerDuty service `pokerhub-ops`) acknowledges within 15 minutes.
2. If not acknowledged in 15 minutes, escalate to SRE lead.
3. After 30 minutes without resolution, escalate to the Engineering Director.
4. Telemetry pipeline incidents also notify the Observability team.
