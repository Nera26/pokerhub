# Telemetry Pipeline

Issues with the OpenTelemetry collector or export path can impact traces,
metrics, and logs.

## Dashboards
- [Latency & Error Overview](../../infrastructure/observability/latency-error-resource-dashboard.json)
- [Alerts Overview](../../infrastructure/observability/alerts-overview-grafana.json)

## Alert Routing
PagerDuty Service: `pokerhub-sre`

## Response Playbook
1. Check collector health using the dashboards above.
2. Verify endpoints defined in
   [`infrastructure/observability/otel-collector.yaml`](../../infrastructure/observability/otel-collector.yaml).
3. Restart the collector if unresponsive.
4. If the pipeline remains degraded after 30 minutes, escalate to the on-call
   SRE via PagerDuty.

## References
- [SLOs](../SLOs.md)
- [Error Budget Procedures](../error-budget-procedures.md)

