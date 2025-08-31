# Alerting Flow

PokerHub uses OpenTelemetry to expose metrics which are scraped by Prometheus. The backend also pushes metrics to an Alertmanager endpoint when `ALERTMANAGER_URL` is configured.

## Setup

Provision dashboards and alert rules with the helper scripts:

```bash
GRAFANA_URL=http://localhost:3000 GRAFANA_API_KEY=<key> ./infrastructure/observability/provision-grafana.sh
ALERTMANAGER_URL=http://localhost:9093 ./infrastructure/observability/provision-alertmanager.sh
```

Prometheus evaluates SLO-based rules such as action ACK latency and socket connect success using multi-window burn rates. Alerts fire when the 5 m/1 h burn rate exceeds **14.4** or the 30 m/6 h burn rate exceeds **6**. Alertmanager routes notifications to PagerDuty and, for canary deployments, emits a `repository_dispatch` event that runs `infra/canary/rollback.sh`. See [SLO alert strategy](../SLOs.md) for details.

## Prometheus Alert Rules
```yaml
groups:
  - name: pokerhub-frontend
    rules:
      - alert: FrontendRouteLatency
        expr: histogram_quantile(0.95, sum(rate(frontend_route_duration_seconds_bucket[5m])) by (le)) > 0.5
        for: 5m
        labels:
          severity: page
          pagerduty_service: pokerhub-eng
        annotations:
          summary: 'Frontend p95 latency > 500ms'
      - alert: FrontendErrorRate
        expr: sum(rate(frontend_errors_total[5m])) / sum(rate(frontend_requests_total[5m])) > 0.01
        for: 5m
        labels:
          severity: page
          pagerduty_service: pokerhub-eng
        annotations:
          summary: 'Frontend error rate above 1%'
```

## Dashboards
- Grafana: <https://grafana.pokerhub.example/d/slo/service-slos>
- Metabase: <https://metabase.pokerhub.example/dashboard/42-alerts>
- JSON definitions live under `../../infrastructure/observability/` and include `pagerduty_service` labels mapping each panel to the owning PagerDuty service.

## PagerDuty Services and Escalation Paths
<!-- Update service IDs or escalation details if PagerDuty services change -->

| `pagerduty_service` | PagerDuty service | Service ID | Escalation path |
| --- | --- | --- | --- |
| `pokerhub-sre` | Core platform and SLO alerts (availability, latency, error rate) | PSRE789 | Primary SRE (5 m) → secondary SRE (15 m) → engineering manager (30 m) → CTO (1 h) |
| `pokerhub-eng` | Feature engineering queues and saturation metrics | PENG012 | Primary engineer → SRE on-call (30 m) → engineering manager (1 h) |
| `pokerhub-ops` | Deployment and operations notifications | — | Primary ops on-call (15 m) → product manager (15 m) → engineering manager (30 m) → CTO (1 h) |

Redis, Postgres and WebSocket metrics from OpenTelemetry are routed to
`pokerhub-sre` (ID: PSRE789) using the `pagerduty_service` tag embedded in Grafana panels.

## Severity Tiers

| Tier | Example Impact | PagerDuty Service | Slack Channel |
| ---- | -------------- | ----------------- | ------------- |
| **P1** | Major outage or data loss | `pokerhub-sre` (PSRE789) | `#pokerhub-incident` |
| **P2** | Degraded functionality | `pokerhub-eng` (PENG012) | `#pokerhub-ops` |
| **P3** | Minor issues or follow ups | — | `#pokerhub-dev` |

## Escalation Policies
- Alertmanager posts events to PagerDuty using the configured routing key.
- The on-call engineer triages using the dashboards above; each JSON file exposes a `pagerduty_service` label to identify the owning service.
- After mitigation, acknowledge and resolve the alert in PagerDuty to close the loop.

PagerDuty escalation policy URLs:

- SRE: <https://pokerhub.pagerduty.com/escalation_policies/PABC123>
- Engineering: <https://pokerhub.pagerduty.com/escalation_policies/PDEF456>
- Ops: <https://pokerhub.pagerduty.com/escalation_policies/PGHI789>

## Relevant Components
- `backend/src/telemetry/telemetry.ts` sets up exporters.
- Prometheus and Alertmanager configuration lives under `infrastructure/monitoring/`.
- Alert rules and dashboard definitions live under `infrastructure/observability/`.

## Metric Runbooks
- [Action ACK Latency](./action-ack-latency.md)
- [Room Worker CPU/Mem](./room-worker-resources.md)
- [Queue Lag](./queue-lag.md)
- [Error Rates](./error-rates.md)
