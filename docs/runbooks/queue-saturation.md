# Queue Saturation

Handle situations where message queues accumulate a backlog faster than consumers can process.

## Monitoring
- Grafana: [Queue Saturation](https://grafana.pokerhub.example/d/queue-saturation) (UID `queue-saturation`)
- Metabase: [Latency & Error Overview](https://metabase.pokerhub.example/dashboard/latency-error-overview)
- Prometheus metric `ws_outbound_queue_depth` (histogram, labeled by `socketId`) and `ws_outbound_queue_max` gauge for peak per-socket backlog.

## Detection
- Rising queue depth metrics or alerts.
- Consumers lagging or timing out.
- Dashboard shows message age exceeding 30 s.
- `queueLag` metric remains above 10 s for 5 m.
- `ws_outbound_queue_max` > 80 for 1 m.

## When to page
Page according to the [SLO error-budget policy](../SLOs.md#error-budget-handling) when queue lag burns budget faster than thresholds.

## Playbook
1. Inspect worker logs for processing errors.
2. Scale up consumers or purge poisoned messages.
3. Verify upstream services (database, cache) are healthy.
4. If backlog persists, run `scripts/queue-drain.sh <queue>` and enable rate limiting on producers.

Refer to [Error Budget Procedures](../error-budget-procedures.md) when saturation burns budget quickly.

## Verification
- Queue depth returns to normal operating levels.
- No new saturation alerts for 15 m.
- `queueLag` metric falls below 2 s.

## Alerting
- Route: [`pokerhub-eng`](../../metrics/alert-routes.md#pokerhub-eng) (PagerDuty ID: PENG012)
- Escalation: [Engineering](https://pokerhub.pagerduty.com/escalation_policies/PDEF456)
- Alert threshold: `ws_outbound_queue_max` ≥ 80 for 1 m triggers `WS Outbound Queue Saturation`.

## Drill
- Simulated monthly with `load/chaos/artillery-packet-loss.yml`.
