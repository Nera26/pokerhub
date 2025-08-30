# Queue Saturation Runbook

Handle situations where message queues accumulate a backlog faster than consumers can process.

## Dashboard
- Grafana: [Queue Lag](../../infrastructure/monitoring/grafana-queue-lag.json)
- Metabase: [Queue Saturation](../analytics-dashboards.md#queue-saturation-1)

## Detection
- Rising queue depth metrics or alerts.
- Consumers lagging or timing out.
- Dashboard shows message age exceeding 30 s.
- `queueLag` metric remains above 10 s for 5 m.

## When to page
Page according to the [SLO error-budget policy](../SLOs.md#error-budget-handling) when queue lag burns budget faster than thresholds.

## Mitigation Steps
1. Inspect worker logs for processing errors.
2. Scale up consumers or purge poisoned messages.
3. Verify upstream services (database, cache) are healthy.
4. If backlog persists, run `scripts/queue-drain.sh <queue>` and enable rate limiting on producers.

## Verification
- Queue depth returns to normal operating levels.
- No new saturation alerts for 15 m.
- `queueLag` metric falls below 2 s.

## PagerDuty Escalation
- Service: `pokerhub-eng`
- Slack: #ops

## Drill
- Simulated monthly with `load/chaos/artillery-packet-loss.yml`.
