# Telemetry Pipeline

Issues with the OpenTelemetry collector or export path can impact traces,
metrics, and logs.

## Dashboards
- [Latency & Error Overview](../../infrastructure/observability/latency-error-resource-dashboard.json)
- [Alerts Overview](../../infrastructure/observability/alerts-overview-grafana.json)

## PagerDuty
- Service: `pokerhub-sre` (ID: PSRE123)
- Escalation: [SRE](https://pokerhub.pagerduty.com/escalation_policies/PABC123)

## Playbook
1. Check collector health using the dashboards above.
2. Verify endpoints defined in [`infrastructure/observability/otel-collector.yaml`](../../infrastructure/observability/otel-collector.yaml).
3. Restart the collector if unresponsive.
4. If the pipeline remains degraded after 30 minutes, escalate to the on-call SRE via PagerDuty.

Refer to [Error Budget Procedures](../error-budget-procedures.md) and the [SLOs](../SLOs.md) when burn rates trigger alerts.

