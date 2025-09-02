# Performance Metrics

`check-perf-metrics.ts` runs the WebSocket load harness and verifies recent
latency and throughput against CI thresholds. `check-backpressure.ts` uses the
same harness to ensure `ws_outbound_queue_depth` and global action counters
remain within bounds.

`check-soak-metrics.ts` queries BigQuery for the latest soak run and enforces
longer-term latency and throughput targets.

## Thresholds

- Latency p95: **≤120 ms**
- Latency p99: **≤200 ms**
- Throughput: **≥150 actions/min**
- Queue depth: **≤80 messages**
- Global actions: must stay below `game_action_global_limit`

The job writes `perf-summary.json` and, on failure, `perf-regression.json`
artifacts for inspection.

## Soak thresholds

The `soak-perf-metrics` CI job runs `check-soak-metrics.ts` with these targets:

- Latency p95: **≤`SOAK_LATENCY_P95_MS` ms** (default 120 ms)
- Throughput: **≥`SOAK_THROUGHPUT_MIN` actions/min** (default 100)
- Metrics fresh within **`SOAK_METRICS_SLA_HOURS` h** (default 24 h)

The job uploads `soak-summary.json` and `soak-regression.json` artifacts for
review when regressions occur.
