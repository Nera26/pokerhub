# Queue Lag

Investigates delays in processing queued actions.

- [Grafana Dashboard](../../infrastructure/monitoring/grafana-queue-lag.json)

## Triage
1. Identify which queues show sustained lag.
2. Check room worker logs for consumer errors.

## Mitigation
- Scale consumers for the affected queue.
- Purge dead-lettered messages if backlog persists.
