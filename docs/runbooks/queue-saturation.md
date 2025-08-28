# Queue Saturation Runbook

Addresses situations where message queues accumulate backlog.

## Symptoms
- Rising queue depth metrics.
- Consumers lagging or timing out.

## Steps
1. Check worker logs for processing errors.
2. Scale up consumers or purge stuck messages.
3. Verify upstream services are healthy.

## Escalation
- PagerDuty: pokerhub-eng
- Slack: #ops
