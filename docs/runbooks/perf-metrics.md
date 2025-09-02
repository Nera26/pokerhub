# Performance Metrics

`check-perf-metrics.ts` runs the WebSocket load harness and verifies recent
latency and throughput against CI thresholds.

## Thresholds

- Latency p95: **≤120 ms**
- Latency p99: **≤200 ms**
- Throughput: **≥150 actions/min**

The job writes `perf-summary.json` and, on failure, `perf-regression.json`
artifacts for inspection.
