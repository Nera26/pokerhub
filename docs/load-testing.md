# Load Testing

This repository provides a consolidated entrypoint for heavy load scenarios across K6 and Artillery.

## Running locally

```bash
SOCKETS=80000 TABLES=10000 RNG_SEED=42 ./load/run-10k-chaos.sh
```

The script will:

- drive the `k6-10k-tables.js` WebSocket scenario
- execute `artillery-10k-tables.yml` HTTP scenario
- collect GC and heap statistics from the metrics endpoint
- write latency histograms, GC/heap statistics and RNG seeds under
  `load/metrics/<timestamp>/`

Artifacts include:

- `k6-summary.json` and `k6-metrics.json`
- `ack-histogram.json`
- `artillery-report.json` and `artillery-latency.json`
- `gc-heap.log`, `heap-histogram.json`, `gc-histogram.json`
- `seed.txt` for deterministic replay

## WebSocket swarm thresholds

`load/k6-swarm.js` records ACK latency histograms and transaction rates for
each table. Thresholds enforce p50 < 40 ms, p95 < 120 ms, p99 < 200 ms and at
least 150 actions per minute. The workflow
[`.github/workflows/k6-swarm-threshold.yml`](../.github/workflows/k6-swarm-threshold.yml)
runs this script in CI and fails when limits are exceeded.

Run locally:

```bash
SOCKETS=100 TABLES=100 npm run load:swarm
```

Results are written to `load/results/k6-swarm-summary.json` with per‑table
latency percentiles and TPS.

## Replaying a run

All randomness is seeded via `RNG_SEED`. Re-run the script with the same seed to replay a scenario:

```bash
RNG_SEED=$(cat load/metrics/<run-id>/seed.txt) ./load/run-10k-chaos.sh
```

## Nightly automation

The workflow [`.github/workflows/k6-100k-chaos.yml`](../.github/workflows/k6-100k-chaos.yml)
runs nightly with `SOCKETS=100000`, `TABLES=10000` and a deterministic
`RNG_SEED`. Each run archives latency histograms, GC/heap statistics and the
seed under a timestamped directory and uploads the folder as a GitHub Actions
artifact (`k6-100k-chaos-<run id>`).

## Sample metrics

Latency histograms and memory/GC statistics from packet loss and jitter scenarios
are exported under the [`load/metrics`](../load/metrics) directory:

- [10k table chaos metrics](../load/metrics/10k-chaos-sample)
- [100k socket chaos metrics](../load/metrics/100k-chaos-sample)
- Grafana dashboards for these runs are versioned under [`load/metrics`](../load/metrics):
  - [100k replay dashboard](../load/metrics/grafana-100k-replay.json)

## 100k socket harness

`backend/test/high-scale-harness.ts` drives 100k WebSocket clients across
10k tables while [Toxiproxy](https://github.com/Shopify/toxiproxy) injects
200 ms latency, 200 ms jitter and 5 % packet loss. The run records
`latency-hist.json`, `memory-usage.json`, `gc-usage.json` and `seeds.json` for
deterministic replay:

```bash
ts-node backend/test/high-scale-harness.ts
ts-node backend/test/replay.ts       # replay using seeds.json
```

Platform level load is exercised with `infra/tests/load/k6-table-actions.js` (enable via `CHAOS_MODE=1`) which
simulates 100k sockets and exports the same latency histogram and memory/GC
snapshots. Re-run a scenario with:

```bash
node infra/tests/load/replay.js seed.txt
```

## Chaos soak workflow

Trigger a 24 h chaos soak via [`soak.yaml`](../.github/workflows/soak.yaml):

```bash
gh workflow run soak.yaml
```

The workflow runs `infra/tests/load/k6-table-actions.js` with `CHAOS_MODE=1` and `DURATION=24h`,
polling GC and heap statistics from `$MEM_URL`. It fails when
`heap_delta_pct \u2265 1` or `gc_p95_ms > 50`.

### Example histogram and memory footprint

```
latency: { "p50": 35, "p95": 112, "p99": 180 }
memory:  { "rss": 520000000, "heapUsed": 210000000 }
gc:      { "before": {"heapUsed": 210000000}, "after": {"heapUsed": 180000000} }
```

## Regression reports

The [`high-scale-regression` workflow](../.github/workflows/high-scale-regression.yml)
executes `tests/performance/socket-load.ts` with 10k tables and 100k sockets.
Each run uploads `latency-hist.json` and `memory-gc.json` under the `metrics`
directory.

To check for latency regressions, download the artifact and compare it with the
baseline histogram:

```bash
npx ts-node scripts/compare-histograms.ts load/metrics/100k-chaos-sample <metrics-dir>
```

The script prints p95/p99 deviations and exits non‑zero if the difference exceeds
5 %. Review `memory-gc.json` for unexpected garbage collection or RSS growth.

## Nightly chaos run summaries

<!-- CHAOS_SUMMARY -->
