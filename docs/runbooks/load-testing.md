# Load Testing Runbook

This runbook describes how to execute large scale load tests and long running soak tests for PokerHub.

## 10k Table Load

1. Ensure the target environment is running.
2. Run the k6 scenario:
   ```bash
   k6 run infra/tests/load/k6-10k-tables.js
   ```
3. Or use Artillery:
   ```bash
   artillery run infra/tests/load/artillery-10k-tables.yml
   ```
4. Inspect metrics for latency and error rates.

## 24h Soak with GC Tracking

1. Deploy canary or test environment.
2. Execute the k6 soak test:
   ```bash
   k6 run infra/tests/load/k6-soak.js --summary-export=soak-summary.json
   ```
3. Alternatively run the Artillery soak:
   ```bash
   artillery run infra/tests/load/artillery-soak.yml
   ```
4. Monitor `gc_pause_ms` or captured `X-GC-Pause` headers for garbage collection pauses.
5. Review resource usage and roll back if thresholds are exceeded.
