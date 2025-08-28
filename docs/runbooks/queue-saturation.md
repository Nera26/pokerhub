# Queue Saturation Runbook

Handle situations where message queues accumulate a backlog faster than consumers can process.

## Detection
- Rising queue depth metrics or alerts.
- Consumers lagging or timing out.
- Dashboard shows message age exceeding 30 s.

## Mitigation Steps
1. Inspect worker logs for processing errors.
2. Scale up consumers or purge poisoned messages.
3. Verify upstream services (database, cache) are healthy.
4. If backlog persists, enable rate limiting on producers.

## Verification
- Queue depth returns to normal operating levels.
- No new saturation alerts for 15 m.

## Escalation
- PagerDuty: pokerhub-eng
- Slack: #ops
