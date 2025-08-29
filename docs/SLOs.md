# SLO Dashboards & Runbooks

This page documents how PokerHub alerts on key Service Level Objectives and links the dashboards and runbooks for each metric.

## Alert Strategy
We use a multi-window, multi-burn-rate approach for the following SLOs:

* **Service uptime** (99.95%)
* **Socket connect success** (99%)
* **Game action ACK latency** (99% of ACKs under 250 ms)

Alerts fire when either burn rate pair breaches: a fast 5 m/1 h window at **14.4×** or a slow 30 m/6 h window at **6×**. Alerts are routed to PagerDuty via `pagerduty_service` labels in the rule definitions.

## Dashboards
- [Socket Connects](../infrastructure/observability/socket-connects-dashboard.json)
- [GC Pauses](../infrastructure/observability/gc-pauses-dashboard.json)
- [Queue Lag](../infrastructure/observability/queue-lag-dashboard.json)
- [SLO Overview](../infrastructure/observability/slo-dashboard.json)

## Runbooks
- [Action ACK Latency](runbooks/action-ack-latency.md)
- [Socket Connect Success](runbooks/socket-connect-success.md)
- [Stuck Hand](runbooks/stuck-hand.md)
- [Orphaned Reservation](runbooks/orphaned-reservation.md)
