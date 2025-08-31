# SLO Dashboards & Runbooks

This page documents how PokerHub alerts on key Service Level Objectives and links the dashboards and runbooks for each metric.

## Setup

Provision Grafana dashboards and alert rules via the helper scripts:

```bash
GRAFANA_URL=http://localhost:3000 GRAFANA_API_KEY=<key> ./infrastructure/observability/provision-grafana.sh
ALERTMANAGER_URL=http://localhost:9093 ./infrastructure/observability/provision-alertmanager.sh
```

### PagerDuty service mapping

| `pagerduty_service` | PagerDuty service |
| --- | --- |
| `pokerhub-sre` | Core platform SRE |
| `pokerhub-eng` | Feature engineering |
| `pokerhub-ops` | Operations |

## SLO Targets
| SLO | Target | Monthly error budget | Burn‑rate alerts | Grafana | Metabase | PagerDuty Service | Escalation Policy |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Service uptime | 99.95% monthly availability | 21.6 m downtime | 14.4× (1h) / 6× (6h) | [Service Uptime](https://grafana.pokerhub.example/d/service-uptime) | [Ops overview](analytics-dashboards.md) | `pokerhub-sre` | [SRE](https://pokerhub.pagerduty.com/escalation_policies/PABC123) |
| Game action ACK latency | 99% of ACKs < 250 ms | 1% slow ACKs | 14.4× (1h) / 6× (6h) | [Socket Latency](https://grafana.pokerhub.example/d/socket-latency) | [Action ACK Latency](analytics-dashboards.md#action-ack-latency-1) | `pokerhub-sre` | [SRE](https://pokerhub.pagerduty.com/escalation_policies/PABC123) |
| Socket connect success | 99% successful connects | 1% failed connects | 14.4× (1h) / 6× (6h) | [Socket Connects](https://grafana.pokerhub.example/d/socket-connects) | [Socket Connect Success](analytics-dashboards.md#socket-connect-success-1) | `pokerhub-sre` | [SRE](https://pokerhub.pagerduty.com/escalation_policies/PABC123) |
| Request error rate | <1% of requests error | 1% error responses | 14.4× (1h) / 6× (6h) | [Error Rates](https://grafana.pokerhub.example/d/error-rates) | [Error Rate](analytics-dashboards.md#error-rate-1) | `pokerhub-sre` | [SRE](https://pokerhub.pagerduty.com/escalation_policies/PABC123) |
| Queue saturation | 99% of queue lag < 2 s | 1% >2 s lag | 14.4× (1h) / 6× (6h) | [Queue Saturation](https://grafana.pokerhub.example/d/queue-saturation) | [Queue Saturation](analytics-dashboards.md#queue-saturation-1) | `pokerhub-eng` | [Engineering](https://pokerhub.pagerduty.com/escalation_policies/PDEF456) |
| Telemetry pipeline uptime | 99.9% collector availability | 43.2 m downtime | 14.4× (1h) / 6× (6h) | [Telemetry Pipeline](https://grafana.pokerhub.example/d/otel-pipeline) | [Telemetry Overview](analytics-dashboards.md#telemetry-overview) | `pokerhub-observability` | [Ops](https://pokerhub.pagerduty.com/escalation_policies/PGHI789) |
| Frontend route latency | 95% of routes < 500 ms | 5% slow routes | 14.4× (1h) / 6× (6h) | [Frontend Route Latency](https://grafana.pokerhub.example/d/frontend-route-latency) | — | `pokerhub-eng` | [Engineering](https://pokerhub.pagerduty.com/escalation_policies/PDEF456) |

We use a multi‑window burn‑rate policy: a fast 5 m/1 h window at **14.4×** and a slow 30 m/6 h window at **6×**. Alerts are routed to PagerDuty via `pagerduty_service` labels in the rule definitions.

## Error Budget Handling

Each SLO allocates a monthly error budget equal to `1 - target`. If more than **50%** of the monthly budget is burned in a week, freeze feature deploys and focus on reliability. Exhausting **100%** of the budget triggers an incident review and requires engineering manager approval for any production changes until the burn rate drops below [Alerting thresholds](runbooks/alerting.md#severity-tiers). Detailed freeze and rollback rules live in [error-budget-procedures.md](error-budget-procedures.md).

## Dashboards
- [Alerts Overview](../infrastructure/observability/alerts-overview-grafana.json)
- [Service SLOs](../infrastructure/observability/slo-dashboard.json)
- [Room CPU/Memory](../infrastructure/observability/room-cpu-memory-dashboard.json)
- [GC Pauses](../infrastructure/observability/gc-pauses-dashboard.json)
- [Queue Saturation](../infrastructure/observability/queue-lag-dashboard.json)
- [Socket Latency](../infrastructure/observability/socket-latency-dashboard.json)
- [Socket Connects](../infrastructure/observability/socket-connects-dashboard.json)
- [Error Rates](../infrastructure/observability/error-rates-dashboard.json)
- [Player Analytics](../infrastructure/observability/player-analytics-dashboard.json)
- [Telemetry Pipeline](../infrastructure/observability/otel-dashboard.json)
- [Frontend Route Latency](../infrastructure/observability/frontend-route-latency-dashboard.json)

All dashboard JSON files include a `pagerduty_service` label that drives the escalation policy documented in [runbooks/alerting.md](runbooks/alerting.md#escalation-policies).

## Runbooks
- [Action ACK Latency](runbooks/action-ack-latency.md)
- [Socket Connect Success](runbooks/socket-connect-success.md)
- [Stuck Hand](runbooks/stuck-hand.md)
- [Orphaned Reservation](runbooks/orphaned-reservation.md)
- [Service Uptime](runbooks/service-uptime.md)
