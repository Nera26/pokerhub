# SLO Dashboards & Runbooks

This page documents how PokerHub alerts on key Service Level Objectives and links the dashboards and runbooks for each metric.

## SLO Targets
| SLO | Target | Burn‑rate alerts |
| --- | --- | --- |
| Service uptime | 99.95% monthly availability | 14.4× (1h) / 6× (6h) |
| Game action ACK latency | 99% of ACKs < 250 ms | 14.4× (1h) / 6× (6h) |
| Socket connect success | 99% successful connects | 14.4× (1h) / 6× (6h) |
| Request error rate | <1% of requests error | 14.4× (1h) / 6× (6h) |
| Queue saturation | 99% of queue lag < 2 s | 14.4× (1h) / 6× (6h) |

We use a multi‑window burn‑rate policy: a fast 5 m/1 h window at **14.4×** and a slow 30 m/6 h window at **6×**. Alerts are routed to PagerDuty via `pagerduty_service` labels in the rule definitions.

## Error Budget Handling

Each SLO allocates a monthly error budget equal to `1 - target`. If more than **50%** of the monthly budget is burned in a week, freeze feature deploys and focus on reliability. Exhausting **100%** of the budget triggers an incident review and requires engineering manager approval for any production changes until the burn rate drops below [Alerting thresholds](runbooks/alerting.md#severity-tiers).

## Dashboards
- [Room CPU/Memory](../infrastructure/monitoring/grafana-room-cpu-mem.json)
- [Queue Lag](../infrastructure/monitoring/grafana-queue-lag.json)
- [Dropped Frames](../infrastructure/monitoring/grafana-dropped-frames.json)
- [Error Rates](../infrastructure/monitoring/grafana-error-rates.json)

Additional historical dashboards remain under `../infrastructure/observability/` for legacy metrics.

## Runbooks
- [Action ACK Latency](runbooks/action-ack-latency.md)
- [Socket Connect Success](runbooks/socket-connect-success.md)
- [Stuck Hand](runbooks/stuck-hand.md)
- [Orphaned Reservation](runbooks/orphaned-reservation.md)
- [Service Uptime](runbooks/service-uptime.md)
