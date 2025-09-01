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
2. Execute the soak test against **staging**:
   ```bash
   WS_URL=ws://staging.pokerhub:3001/game ts-node backend/src/game/soak-harness.ts > soak.log
   ```
   The harness provisions a table, configures Toxiproxy with 5% packet loss and
   200 ms jitter, then kills the room worker mid‑hand. `RoomManager` should
   restart the worker, replay the last `HandLog`, and continue dealing. Any
   replay mismatch increments `soak_replay_failures_total` and aborts the run.
3. Review `soak.log`:
   - `heap_used_bytes` should grow less than 1%.
   - `gc_pause_ms` p95 must remain under 50 ms.
   - `soak_replay_failures_total` must stay at 0.

## Mitigation
- Roll back deployments introducing leaks.
- Capture heap profiles and GC traces for analysis.
