# Alert Policies

PokerHub uses PagerDuty to guard the SLO error budgets defined in [../SLOs.md](../SLOs.md). Each alert watches a multi-window burn rate and fires well before the monthly error budget is exhausted.

## Policies

| SLO | PagerDuty Service | Error Budget |
| --- | ---------------- | ------------ |
| Service uptime | `pokerhub-sre` | 0.05% monthly downtime |
| Game action ACK latency | `pokerhub-game` | 1% of ACKs slower than 250 ms |
| Socket connect success | `pokerhub-socket` | 1% failed connects |

Alert rules live under `infra/observability/` and include `slo` and `pagerduty_service` labels so Grafana burn-rate panels and PagerDuty routes stay in sync.
