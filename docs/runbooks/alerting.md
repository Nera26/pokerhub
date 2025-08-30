# Alerting Flow

PokerHub uses OpenTelemetry to expose metrics which are scraped by Prometheus. The backend also pushes metrics to an Alertmanager endpoint when `ALERTMANAGER_URL` is configured.

Prometheus evaluates SLO-based rules such as action ACK latency and socket connect success using multi-window burn rates. Alerts fire when the 5 m/1 h burn rate exceeds **14.4** or the 30 m/6 h burn rate exceeds **6**. Alertmanager routes notifications to PagerDuty and, for canary deployments, emits a `repository_dispatch` event that runs `infra/canary/rollback.sh`. See [SLO alert strategy](../SLOs.md) for details.

## Dashboards
- Grafana: [Service SLOs](../../infrastructure/observability/slo-dashboard.json)
- Additional dashboards live under `../../infrastructure/observability/` and include `pagerduty_service` labels mapping each panel to the owning PagerDuty service.

## PagerDuty Services
- `pokerhub-sre` – Core platform and SLO alerts (availability, latency, error rate).
- `pokerhub-eng` – Feature engineering queues and saturation metrics.
- `pokerhub-ops` – Deployment and operations notifications.

## Severity Tiers

| Tier | Example Impact | PagerDuty Service | Slack Channel |
| ---- | -------------- | ----------------- | ------------- |
| **P1** | Major outage or data loss | `pokerhub-sre` | `#pokerhub-incident` |
| **P2** | Degraded functionality | `pokerhub-eng` | `#pokerhub-ops` |
| **P3** | Minor issues or follow ups | — | `#pokerhub-dev` |

## Escalation Policies
- Alertmanager posts events to PagerDuty using the configured routing key.
- The on-call engineer triages using the dashboards above; each JSON file exposes a `pagerduty_service` label to identify the owning service.
- After mitigation, acknowledge and resolve the alert in PagerDuty to close the loop.

### Service Escalation Paths

| `pagerduty_service` | Escalation path |
| --- | --- |
| `pokerhub-sre` | Primary SRE (5 m) → secondary SRE (15 m) → engineering manager (30 m) → CTO (1 h) |
| `pokerhub-eng` | Primary engineer → SRE on-call (30 m) → engineering manager (1 h) |
| `pokerhub-ops` | Primary ops on-call (15 m) → product manager (15 m) → engineering manager (30 m) → CTO (1 h) |

## Relevant Components
- `backend/src/telemetry/telemetry.ts` sets up exporters.
- Prometheus and Alertmanager configuration lives under `infrastructure/monitoring/`.
- Alert rules and dashboard definitions live under `infrastructure/observability/`.

## Metric Runbooks
- [Action ACK Latency](./action-ack-latency.md)
- [Room Worker CPU/Mem](./room-worker-resources.md)
- [Queue Lag](./queue-lag.md)
- [Error Rates](./error-rates.md)
