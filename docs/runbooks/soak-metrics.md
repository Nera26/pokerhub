# Soak Metrics

Key soak test outputs are exported to Cloud Monitoring for long-term visibility.

## Cloud Monitoring Metrics

| Metric | Unit | Description |
| --- | --- | --- |
| `custom.googleapis.com/soak/latency` | milliseconds | p95 request latency |
| `custom.googleapis.com/soak/throughput` | requests per second | average throughput |
| `custom.googleapis.com/soak/gc_pause_p95_ms` | milliseconds | p95 GC pause time |
| `custom.googleapis.com/soak/rss_delta_pct` | percent | RSS growth over the soak run |

`scripts/check-soak-metrics.ts` writes these metrics during the soak-metrics workflow.

## Thresholds

- Latency p95: **≤120 ms**
- Latency p99: **≤200 ms**
- Throughput: **≥150 actions/min**
- GC pause p95: **≤50 ms**
- RSS growth over 24h: **<1%**

Refer to related runbooks for remediation steps:

- [GC Pauses](./gc-pauses.md)
