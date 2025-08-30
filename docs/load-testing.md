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
