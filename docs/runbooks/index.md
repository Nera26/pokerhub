# Metric Runbooks

Central index of metric runbooks with links to dashboards and PagerDuty escalation policies.

| Metric | Dashboard | Runbook | PagerDuty service | Escalation policy |
| --- | --- | --- | --- | --- |
| Service uptime | [Service Uptime](../../infrastructure/observability/service-uptime-dashboard.json) | [Service Uptime](service-uptime.md) | `pokerhub-sre` | [SRE](https://pokerhub.pagerduty.com/escalation_policies/PABC123) |
| Action ACK latency | [Socket Latency](../../infrastructure/observability/socket-latency-dashboard.json) | [Action ACK Latency](action-ack-latency.md) | `pokerhub-sre` | [SRE](https://pokerhub.pagerduty.com/escalation_policies/PABC123) |
| Socket connect success | [Socket Connects](../../infrastructure/observability/socket-connects-dashboard.json) | [Socket Connect Success](socket-connect-success.md) | `pokerhub-sre` | [SRE](https://pokerhub.pagerduty.com/escalation_policies/PABC123) |
| Request error rate | [Error Rates](../../infrastructure/observability/error-rates-dashboard.json) | [Error Rates](error-rates.md) | `pokerhub-sre` | [SRE](https://pokerhub.pagerduty.com/escalation_policies/PABC123) |
| Queue lag | [Queue Lag](../../infrastructure/observability/queue-lag-dashboard.json) | [Queue Lag](queue-lag.md) | `pokerhub-eng` | [Engineering](https://pokerhub.pagerduty.com/escalation_policies/PDEF456) |
| Room worker resources | [Room CPU/Memory](../../infrastructure/observability/room-cpu-memory-dashboard.json) | [Room Worker Resources](room-worker-resources.md) | `pokerhub-sre` | [SRE](https://pokerhub.pagerduty.com/escalation_policies/PABC123) |
| GC pauses | [GC Pauses](../../infrastructure/observability/gc-pauses-dashboard.json) | [GC Pauses](gc-pauses.md) | `pokerhub-eng` | [Engineering](https://pokerhub.pagerduty.com/escalation_policies/PDEF456) |
| Telemetry pipeline | [Latency/Error/Resource](../../infrastructure/observability/latency-error-resource-dashboard.json) | [Telemetry Pipeline](telemetry-pipeline.md) | `pokerhub-sre` | [SRE](https://pokerhub.pagerduty.com/escalation_policies/PABC123) |
| Player analytics | [Player Analytics](../../infrastructure/observability/player-analytics-dashboard.json) | [Player Analytics](player-analytics.md) | `pokerhub-eng` | [Engineering](https://pokerhub.pagerduty.com/escalation_policies/PDEF456) |

## On‑call Escalation Path
1. Primary on‑call acknowledges within 15 minutes.
2. After 15 minutes without acknowledgment, escalate to the SRE lead.
3. After 30 minutes without resolution, escalate to the Engineering Director, then CTO.
