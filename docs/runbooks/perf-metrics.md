# Performance Metrics

`check-perf-metrics.ts` runs the WebSocket load harness and verifies recent
latency and throughput against CI thresholds. `check-backpressure.ts` uses the
same harness to ensure `ws_outbound_queue_depth` and global action counters
remain within bounds.

## Thresholds

- Latency p95: **≤120 ms**
- Latency p99: **≤200 ms**
- Throughput: **≥150 actions/min**
- Queue depth: **≤80 messages**
- Global actions: must stay below `game_action_global_limit`

The job writes `perf-summary.json` and, on failure, `perf-regression.json`
artifacts for inspection.
