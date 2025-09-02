# Metric Runbooks
<!-- Update PagerDuty service IDs here and in associated runbooks if services change -->

Central index of metric runbooks with links to dashboards and PagerDuty escalation policies.

| Metric | Dashboard | Runbook | PagerDuty service | Escalation policy |
| --- | --- | --- | --- | --- |
| HTTP API latency | [HTTP API Latency](../../infra/observability/http-api-latency-dashboard.json) | [HTTP API Latency](http-api-latency.md) | `pokerhub-sre` (PM5RKAT) | [SRE](https://pokerhub.pagerduty.com/escalation_policies/P3IMDMC) |
| WebSocket latency | [WebSocket Latency](../../infra/observability/websocket-latency-dashboard.json) | [WebSocket Latency](websocket-latency.md) | `pokerhub-sre` (PM5RKAT) | [SRE](https://pokerhub.pagerduty.com/escalation_policies/P3IMDMC) |
| Action ACK latency | [Socket Latency](../../infra/observability/socket-latency-dashboard.json) | [Action ACK Latency](action-ack-latency.md) | `pokerhub-sre` (PM5RKAT) | [SRE](https://pokerhub.pagerduty.com/escalation_policies/P3IMDMC) |
| Wallet throughput | [Wallet Throughput](../../infra/observability/wallet-throughput-dashboard.json) | [Wallet Throughput](wallet-throughput.md) | `pokerhub-sre` (PM5RKAT) | [SRE](https://pokerhub.pagerduty.com/escalation_policies/P3IMDMC) |
| Service uptime | [Service Uptime](../../infra/observability/service-uptime-dashboard.json) | [Service Uptime](service-uptime.md) | `pokerhub-sre` (PM5RKAT) | [SRE](https://pokerhub.pagerduty.com/escalation_policies/P3IMDMC) |
| Request error rate | [Error Rates](../../infra/observability/error-rates-dashboard.json) | [Error Rates](error-rates.md) | `pokerhub-sre` (PM5RKAT) | [SRE](https://pokerhub.pagerduty.com/escalation_policies/P3IMDMC) |
| Socket connect success | [Socket Connects](../../infra/observability/socket-connects-dashboard.json) | [Socket Connect Success](socket-connect-success.md) | `pokerhub-sre` (PM5RKAT) | [SRE](https://pokerhub.pagerduty.com/escalation_policies/P3IMDMC) |
| Queue saturation | [Queue Lag](../../infra/observability/queue-lag-dashboard.json) | [Queue Saturation](queue-saturation.md) | `pokerhub-eng` (PENG012) | [Engineering](https://pokerhub.pagerduty.com/escalation_policies/PD9YTWT) |
| Room worker resources | [Room CPU/Memory](../../infra/observability/room-cpu-memory-dashboard.json) | [Room Worker Resources](room-worker-resources.md) | `pokerhub-sre` (PM5RKAT) | [SRE](https://pokerhub.pagerduty.com/escalation_policies/P3IMDMC) |
| GC pauses | [GC Pauses](../../infra/observability/gc-pauses-dashboard.json) | [GC Pauses](gc-pauses.md) | `pokerhub-eng` (PENG012) | [Engineering](https://pokerhub.pagerduty.com/escalation_policies/PD9YTWT) |
| Telemetry pipeline | [Latency/Error/Resource](../../infra/observability/latency-error-resource-dashboard.json) | [Telemetry Pipeline](telemetry-pipeline.md) | `pokerhub-sre` (PM5RKAT) | [SRE](https://pokerhub.pagerduty.com/escalation_policies/P3IMDMC) |
| Player analytics | [Player Analytics](../../infra/observability/player-analytics-dashboard.json) | [Player Analytics](player-analytics.md) | `pokerhub-eng` (PENG012) | [Engineering](https://pokerhub.pagerduty.com/escalation_policies/PD9YTWT) |

## On‑call Escalation Path
1. Primary on‑call acknowledges within 15 minutes.
2. After 15 minutes without acknowledgment, escalate to the SRE lead.
3. After 30 minutes without resolution, escalate to the Engineering Director, then CTO.
