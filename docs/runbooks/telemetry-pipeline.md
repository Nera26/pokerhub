# Telemetry Pipeline

Issues with the OpenTelemetry collector or export path can impact traces,
metrics, and logs.

## Monitoring
- Grafana: [Telemetry Pipeline](https://grafana.pokerhub.example/d/otel-pipeline) (UID `otel-pipeline`)
- Metabase: [Alerts Overview](https://metabase.pokerhub.example/dashboard/alerts-overview)

## Alerting
- Route: [`pokerhub-observability`](../../metrics/alert-routes.md#pokerhub-observability) (PagerDuty ID: POBS321)
- Escalation: [Ops](https://pokerhub.pagerduty.com/escalation_policies/PGHI789)

## Playbook
1. Check collector health using the dashboards above.
2. Verify endpoints defined in [`infra/observability/otel-collector.yaml`](../../infra/observability/otel-collector.yaml).
3. Restart the collector if unresponsive.
4. If the pipeline remains degraded after 30 minutes, escalate to the observability on-call via PagerDuty.

Refer to [Error Budget Procedures](../error-budget-procedures.md) and the [SLOs](../SLOs.md) when burn rates trigger alerts.

