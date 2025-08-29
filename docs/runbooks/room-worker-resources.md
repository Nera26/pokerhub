# Room Worker CPU/Mem

Handles situations where room workers consume excessive CPU or memory.

- [Grafana Dashboard](../../infrastructure/monitoring/grafana-room-worker.json)

## Triage
1. Determine which room worker pods are exceeding thresholds.
2. Check for memory leaks or hot loops in recent deployments.

## Mitigation
- Restart or scale the room worker deployment.
- Roll back recent changes if resource usage remains high.
