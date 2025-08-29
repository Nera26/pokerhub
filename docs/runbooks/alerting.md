# Alerting Flow

PokerHub uses OpenTelemetry to expose metrics which are scraped by Prometheus. The backend also pushes metrics to an Alertmanager endpoint when `ALERTMANAGER_URL` is configured.

Prometheus evaluates SLO-based rules such as action ACK latency and socket connect success. Alerts are sent to Alertmanager which routes notifications to PagerDuty.

## PagerDuty Escalation
- Alertmanager posts events to PagerDuty using the configured routing key.
- The on-call engineer receives a page and triages using the dashboards in Grafana.
- After mitigation, acknowledge and resolve the alert in PagerDuty to close the loop.

## Relevant Components
- `backend/src/telemetry/telemetry.ts` sets up exporters.
- Prometheus and Alertmanager are deployed via `infrastructure/observability/prometheus-grafana.yaml`.
- Alert rules live under `infra/observability/`.

## Metric Runbooks
- [Action ACK Latency](./action-ack-latency.md)
- [Room Worker CPU/Mem](./room-worker-resources.md)
- [Queue Lag](./queue-lag.md)
- [Error Rates](./error-rates.md)
