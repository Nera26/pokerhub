# Service Level Objectives

See [KPI Benchmarks](./kpi-benchmarks.md) for target performance metrics.

## Latency
- **HTTP API**: p99 < 200ms
- **WebSocket messages**: p95 < 100ms
- **Action ACK**: p95 < 120ms

Burn rate alert thresholds:
- Action ACK latency error budget burn rate > **14.4** (1h) or **6** (6h).

Dashboards:
- [Socket latency](https://grafana.pokerhub.example.com/d/socket-latency)
- [Queue lag](https://grafana.pokerhub.example.com/d/queue-lag)
- [Error rates](https://grafana.pokerhub.example.com/d/error-rates)

## Uptime
- **Overall availability**: 99.95% monthly

Dashboards:
- [Room CPU/memory](https://grafana.pokerhub.example.com/d/room-resources)

Status: [Status page](https://status.pokerhub.example.com)

## Monitoring
Prometheus recording rules for action ACK latency, socket connect success, and service uptime live under [infra/monitoring](../infra/monitoring).
Alertmanager routes their alerts to the `pokerhub-ops` PagerDuty service.

## Connectivity
- **Socket connect success**: > 99%

Burn rate alert thresholds:
- Socket connect success error budget burn rate > **14.4** (1h) or **6** (6h).

## Backups
- **Restore duration**: < 30m
- **Snapshot age**: < 5m

Dashboards:
- [DB restore](https://grafana.pokerhub.example.com/d/db-restore)

## Escalation Policy
- Primary on-call via [PagerDuty](https://pagerduty.com/services/pokerhub-sre).
- `GAME_ACTION_ACK_LATENCY_MS` burn-rate alerts page the `pokerhub-ops` service.
- Latency, action ACK, and socket connect SLO burn-rate alerts trigger at 1h (14.4) and 6h (6) windows.
- Escalate to SRE lead after 15m without acknowledgement.
- Escalate to Engineering Director after 30m without acknowledgement.
