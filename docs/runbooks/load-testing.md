# Load Testing Runbook

This runbook describes how to execute large scale load tests and long running soak tests for PokerHub.

## GitHub Actions Pipeline

The `load-regression` workflow in `.github/workflows/load-regression.yml` runs our k6 regression tests using the [grafana/k6-action](https://github.com/grafana/k6-action). It executes two scenarios:

- `load/k6-10k-tables.js`
- `load/k6-ws-packet-loss.js`

Both scripts embed thresholds aligned with our SLOs. `k6-10k-tables.js` fails if more than 1% of requests error or if p95 latency exceeds 300 ms. `k6-ws-packet-loss.js` fails when WebSocket p95 latency goes above 120 ms. When any threshold is breached the k6 process exits non‑zero, causing the workflow to fail.

Each step exports a JSON summary (`10k-summary.json` or `packet-summary.json`). Review the `thresholds` section – entries with `"passed": false` indicate a regression.

## 10k Table Load

1. Ensure the target environment is running.
2. Run the k6 scenario:
   ```bash
   k6 run load/k6-10k-tables.js
   ```
3. Or use Artillery:
   ```bash
   artillery run load/artillery-10k-tables.yml
   ```
4. Inspect metrics for latency and error rates.

## 24h Soak with CPU/GC Monitoring

1. Deploy canary or test environment.
2. Start the metrics collector (exits non‑zero when limits are hit):
   ```bash
   METRICS_URL=http://localhost:3000/metrics \
   CPU_THRESHOLD=80 HEAP_THRESHOLD=$((512*1024*1024)) GC_THRESHOLD=50 \
   load/collect-gc-heap.sh &
   ```
3. Execute the k6 soak test:
   ```bash
   k6 run load/k6-ws-soak.js --summary-export=soak-summary.json
   ```
4. Alternatively run the Artillery soak:
   ```bash
   artillery run load/artillery-ws-packet-loss.yml
   ```
5. The k6 script enforces <1% heap growth, p95 GC pause <50 ms and CPU usage <80%.
6. After the test, review `gc-heap-metrics.log` and roll back if thresholds were breached.
