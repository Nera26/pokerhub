# Game Gateway Soak
<!-- Update service IDs in this file if PagerDuty services change -->

Runs the Game Gateway soak harness for 24 h to detect memory leaks and GC regressions.

## Dashboard
- Grafana: [GC Pauses](../../infra/observability/gc-pauses-dashboard.json)

## PagerDuty Escalation
- Service: `pokerhub-sre` (ID: PSRE789)

## Triage
1. Execute the soak harness:
   ```bash
   ts-node backend/src/game/soak-harness.ts > soak.log
   ```
   Environment variables like `SOCKETS`, `TABLES` or `WS_URL` override defaults.
2. After the run completes, review `soak.log`:
   - `heap delta` should be less than 1 %.
   - `GC p95` must remain under 50 ms.
   The process exits non‑zero if thresholds are breached.

## Mitigation
- Roll back deployments introducing leaks.
- Capture heap profiles and GC traces for analysis.
