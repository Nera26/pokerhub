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
- write latency histograms and raw metrics under `load/metrics/`

Artifacts include:

- `k6-summary.json` and `k6-metrics.json`
- `ack-histogram.json`
- `artillery-report.json` and `artillery-latency.json`
- `gc-heap.log`
- `seed.txt` for deterministic replay

## Replaying a run

All randomness is seeded via `RNG_SEED`. Re-run the script with the same seed to replay a scenario:

```bash
RNG_SEED=$(cat load/metrics/seed.txt) ./load/run-10k-chaos.sh
```

## Nightly automation

The workflow `.github/workflows/k6-10k-chaos.yml` runs nightly with
`SOCKETS=80000`, `TABLES=10000` and a deterministic `RNG_SEED`. Metrics from
nightly runs are uploaded as build artifacts for inspection.

## Sample metrics

Latency histograms and memory/GC statistics from packet loss and jitter scenarios
are exported under the [`load/metrics`](../load/metrics) directory:

- [10k table chaos metrics](../load/metrics/10k-chaos-sample)
- [100k socket chaos metrics](../load/metrics/100k-chaos-sample)
