# Load Testing Runbook
<!-- Update service IDs in this file if PagerDuty services change -->

This runbook describes how to execute large scale load tests and long running soak tests for PokerHub.

## Dashboard
- Grafana: [Load Testing](../analytics-dashboards.md#action-ack-latency)

## PagerDuty Escalation
- Service: `pokerhub-sre` (ID: PSRE789)

## GitHub Actions Pipeline

The `load-regression` workflow in `.github/workflows/load-regression.yml` runs our k6 regression tests using the [grafana/k6-action](https://github.com/grafana/k6-action). It executes two scenarios:

- `load/k6-10k-tables.js`
- `load/k6-ws-packet-loss.js`

Both scripts embed thresholds aligned with our SLOs. `k6-10k-tables.js` fails if more than 1% of requests error or if p95 latency exceeds 300 ms. `k6-ws-packet-loss.js` fails when WebSocket p95 latency goes above 120 ms. When any threshold is breached the k6 process exits non‑zero, causing the workflow to fail.

Each step exports a JSON summary (`10k-summary.json` or `packet-summary.json`). Review the `thresholds` section – entries with `"passed": false` indicate a regression.

## Example Replay

Chaos runs record their random seed and metrics under a timestamped directory in
`load/metrics/`.

1. Run the chaos harness:
   ```bash
   ./load/run-10k-chaos.sh
   ```
   This creates `load/metrics/<timestamp>/` containing `seed.txt`, latency
   histograms and GC/heap statistics.
2. Replay the run using the stored seed and settings:
   ```bash
   ./load/run-10k-chaos.sh --replay load/metrics/<timestamp>
   ```
Replay metrics are written to `load/metrics/<timestamp>/replay/` for
comparison.
3. Or rerun deterministically via `RNG_SEED`:
   ```bash
   RNG_SEED=$(cat load/metrics/<timestamp>/seed.txt) ./load/run-10k-chaos.sh
   ```
   This regenerates metrics under a new timestamped directory.

### 100k socket replay

1. Download the `k6-100k-chaos` artifact from CI and extract it under
   `load/metrics/<run-id>`.
2. Run the deterministic replay with the captured seed and network impairments:
   ```bash
   ./load/run-100k-chaos.sh --replay load/metrics/<run-id>
   ```
3. Inspect `replay/ack-histogram.json`, `replay/heap-histogram.json` and
   `replay/gc-histogram.json`.
4. Thresholds:
   - ACK latency p95 **<120 ms**
   - Error rate **<1 %**
   - GC pause p95 **<50 ms**
   - Heap usage p95 **<512 MB**

## Metrics Output

Each chaos harness run produces a timestamped directory under
`load/metrics/` containing:

- `k6-summary.json` / `k6-metrics.json` – raw k6 results and threshold data.
- `ack-histogram.json` – acknowledgement latency distribution.
- `gc-histogram.json` and `heap-histogram.json` – bucketed GC pause and heap
  usage.
- `gc-stats.json` and `heap-stats.json` – p95, p99 and max values derived from
  the collector log.
- `seed.txt`, `packet-loss.txt`, `jitter-ms.txt` – parameters for replay.

The latest run is available via the `load/metrics/latest` symlink and the
GitHub workflow publishes this directory as an artifact and syncs it to the
`CHAOS_TRENDS_BUCKET` for historical trend analysis.

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

## WebSocket ACK Latency Gate

This gate ensures that action acknowledgements remain below the 120 ms p95 SLO under adverse network conditions.

1. Start the Toxiproxy container (provides 5 % packet loss and 200 ms jitter):
   ```bash
   docker run -d --name toxiproxy -p 8474:8474 -p 3001:3001 ghcr.io/shopify/toxiproxy
   ```
2. Execute the k6 scenario:
   ```bash
   k6 run infra/tests/load/k6-table-actions.js \
     --summary-export=ws-ack-summary.json
   ```
3. Metrics are inserted into ClickHouse (`ws_ack_latency` table) and visualised via `infra/tests/load/grafana-ws-ack.json`.
4. The CI gate fails when `ack_latency` p95 exceeds **120 ms** or if dropped frames rise, indicating packet loss beyond 5 %.

## Seeded Socket Chaos Harness

This harness (`backend/test/load/socket-load.ts`) drives up to **10k** tables and
**100k** sockets while injecting network faults. Each run emits a deterministic
seed file (`seeds.json`) and a latency histogram (`latency-hist.json`).

1. Start the collector and run the harness:

   ```bash
   METRICS_URL=http://localhost:3000/metrics \
   CLICKHOUSE_URL=$CH_URL TABLES=10000 SOCKETS=100000 \
   npx ts-node backend/test/load/socket-load.ts
   ```
2. Inspect `latency-hist.json`; p95 must remain **≤120 ms** and dropped frames
   should stay below 5 %.
3. `seeds.json` can be replayed via `backend/test/soak/seed-replay.ts` to
   validate engine determinism.
4. GC statistics from `gc-heap-metrics.log` and latency histograms are pushed to
   ClickHouse by the `k6-10k-chaos` workflow.

### Failure triage

- **p95 exceeded** – check Toxiproxy logs for packet loss or elevated latency.
- **Dropped frames** – verify websocket server health and network stability.
- **Seed replay mismatch** – run `ts-node backend/test/soak/seed-replay.ts` to
  isolate non-deterministic behaviour.

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

### Interpreting soak summaries

`k6-ws-soak.js` writes a JSON report (`soak-summary.json`) with a `metrics`
object. The key fields are:

- `ws_latency` – round-trip acknowledgement latency; check `p(95)` < 120 ms.
- `rss_growth` – percentage increase in RSS; values above 1 % signal a leak.
- `gc_pause` – garbage collection pause time; `p(95)` should remain under 50 ms.
- `cpu_usage` – maximum CPU usage; must stay below the configured threshold
  (80 % by default).

Each metric has an associated `thresholds` array. Any entry with `"ok": false`
indicates a failure and the CI gate will exit non‑zero.
