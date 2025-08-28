# Service Level Objectives

## Latency
- **HTTP API**: p99 < 200ms
- **WebSocket messages**: p95 < 100ms
- **Action ACK**: p95 < 120ms

Dashboards:
- [Socket latency](https://grafana.pokerhub.example.com/d/socket-latency)
- [Queue lag](https://grafana.pokerhub.example.com/d/queue-lag)
- [Error rates](https://grafana.pokerhub.example.com/d/error-rates)

## Uptime
- **Overall availability**: 99.95% monthly

Dashboards:
- [Room CPU/memory](https://grafana.pokerhub.example.com/d/room-resources)

Status: [Status page](https://status.pokerhub.example.com)

## Escalation Policy
- Primary on-call via [PagerDuty](https://pagerduty.com/services/pokerhub-sre)
- Escalate to SRE lead after 15m without acknowledgement.
