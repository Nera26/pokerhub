# Action Swarm Soak
<!-- Update service IDs in this file if PagerDuty services change -->

Runs the WebSocket action swarm for 24 h to uncover memory leaks or GC regressions.

## Dashboard
- Grafana: [Room CPU/Memory](../../infra/monitoring/grafana-room-cpu-mem.json)

## PagerDuty Escalation
- Service: `pokerhub-sre` (ID: PSRE789)

## Triage
1. Start metrics polling:
   ```bash
   METRICS_URL=http://staging.pokerhub:3000/metrics \
   load/collect-gc-heap.sh &
   ```
2. Execute the soak test:
   ```bash
   npm run soak:test -- -e METRICS_URL=http://staging.pokerhub:3000/metrics \
     --log-format json > soak.log
   ```
3. Review `soak.log`:
   - `heap_used_bytes` should grow less than 1%.
   - `gc_pause_ms` p95 must remain under 50 ms.

## Mitigation
- Roll back deployments introducing leaks.
- Capture heap profiles and GC traces for analysis.
