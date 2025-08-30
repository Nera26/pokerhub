# SLO Dashboards & Runbooks

This page documents how PokerHub alerts on key Service Level Objectives and links the dashboards and runbooks for each metric.

## SLO Targets
| SLO | Target | Burn‑rate alerts | Grafana | Metabase | PagerDuty Service |
| --- | --- | --- | --- | --- | --- |
| Service uptime | 99.95% monthly availability | 14.4× (1h) / 6× (6h) | [Room CPU/Memory](../infrastructure/observability/room-cpu-memory-dashboard.json) | [Ops overview](analytics-dashboards.md) | `pokerhub-sre` |
| Game action ACK latency | 99% of ACKs < 250 ms | 14.4× (1h) / 6× (6h) | [Socket Latency](../infrastructure/observability/socket-latency-dashboard.json) | [Action ACK Latency](analytics-dashboards.md#action-ack-latency-1) | `pokerhub-sre` |
| Socket connect success | 99% successful connects | 14.4× (1h) / 6× (6h) | [Socket Connects](../infrastructure/observability/socket-connects-dashboard.json) | [Socket Connect Success](analytics-dashboards.md#socket-connect-success-1) | `pokerhub-sre` |
| Request error rate | <1% of requests error | 14.4× (1h) / 6× (6h) | [Error Rates](../infrastructure/observability/error-rates-dashboard.json) | [Error Rate](analytics-dashboards.md#error-rate-1) | `pokerhub-sre` |
| Queue saturation | 99% of queue lag < 2 s | 14.4× (1h) / 6× (6h) | [Queue Lag](../infrastructure/observability/queue-lag-dashboard.json) | [Queue Saturation](analytics-dashboards.md#queue-saturation-1) | `pokerhub-eng` |
| Telemetry pipeline uptime | 99.9% collector availability | 14.4× (1h) / 6× (6h) | [Latency & Error Overview](../infrastructure/observability/latency-error-resource-dashboard.json) | [Telemetry Overview](analytics-dashboards.md#telemetry-overview) | `pokerhub-sre` |
| Frontend route latency | 95% of routes < 500 ms | 14.4× (1h) / 6× (6h) | [Frontend Route Latency](analytics-dashboards.md#frontend-route-latency) | — | `pokerhub-eng` |

We use a multi‑window burn‑rate policy: a fast 5 m/1 h window at **14.4×** and a slow 30 m/6 h window at **6×**. Alerts are routed to PagerDuty via `pagerduty_service` labels in the rule definitions.

## Error Budget Handling

Each SLO allocates a monthly error budget equal to `1 - target`. If more than **50%** of the monthly budget is burned in a week, freeze feature deploys and focus on reliability. Exhausting **100%** of the budget triggers an incident review and requires engineering manager approval for any production changes until the burn rate drops below [Alerting thresholds](runbooks/alerting.md#severity-tiers). Detailed freeze and rollback rules live in [error-budget-procedures.md](error-budget-procedures.md).

## Dashboards
- [Alerts Overview](../infrastructure/observability/alerts-overview-grafana.json)
- [Service SLOs](../infrastructure/observability/slo-dashboard.json)
- [Room CPU/Memory](../infrastructure/observability/room-cpu-memory-dashboard.json)
- [GC Pauses](../infrastructure/observability/gc-pauses-dashboard.json)
- [Queue Lag](../infrastructure/observability/queue-lag-dashboard.json)
- [Socket Latency](../infrastructure/observability/socket-latency-dashboard.json)
- [Socket Connects](../infrastructure/observability/socket-connects-dashboard.json)
- [Error Rates](../infrastructure/observability/error-rates-dashboard.json)
- [Player Analytics](../infrastructure/observability/player-analytics-dashboard.json)
- [Frontend Route Latency](analytics-dashboards.md#frontend-route-latency)

All dashboard JSON files include a `pagerduty_service` label that drives the escalation policy documented in [runbooks/alerting.md](runbooks/alerting.md#pagerduty-escalation).

## Runbooks
- [Action ACK Latency](runbooks/action-ack-latency.md)
- [Socket Connect Success](runbooks/socket-connect-success.md)
- [Stuck Hand](runbooks/stuck-hand.md)
- [Orphaned Reservation](runbooks/orphaned-reservation.md)
- [Service Uptime](runbooks/service-uptime.md)
