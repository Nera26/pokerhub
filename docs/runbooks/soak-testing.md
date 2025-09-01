# Soak Testing
<!-- Update service IDs in this file if PagerDuty services change -->

Runs the soak harness to detect memory leaks and GC regressions over 24 h.

## Dashboard
- Grafana: [GC Pauses](../../infra/observability/gc-pauses-dashboard.json)

## PagerDuty Escalation
- Service: `pokerhub-sre` (ID: PSRE789)

## Triage
1. Execute the harness:
   ```bash
   ts-node backend/src/game/soak-harness.ts > soak.log
   ```
   Environment variables like `SOCKETS`, `TABLES` or `WS_URL` override defaults.
2. Metrics are appended every second to `infra/metrics/soak_gc.jsonl` containing
   `heapUsed` bytes and event loop utilization samples.
3. After completion, read the final line of the metrics file and verify:
   - `heap_delta_pct` is less than 1 %.
   - `gc_p95_ms` remains under 50 ms.
   The process exits non‑zero if thresholds are breached.

## Mitigation
- Roll back deployments introducing leaks.
- Capture heap profiles and GC traces for analysis.
