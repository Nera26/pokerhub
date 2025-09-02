# Queue Saturation

Handle situations where message queues accumulate a backlog faster than consumers can process.

## Monitoring
- Grafana: [Queue Saturation](https://grafana.pokerhub.example/d/queue-saturation) (UID `queue-saturation`)
- Metabase: [Latency & Error Overview](https://metabase.pokerhub.example/dashboard/latency-error-overview)
- Prometheus metrics:
  - `ws_outbound_queue_depth` histogram (labeled by `socketId`)
  - `ws_outbound_queue_max` gauge for peak per-socket backlog
  - `ws_outbound_queue_limit` gauge for configured queue capacity
  - `game_action_global_limit` gauge for cluster-wide action rate limit
  - `game_action_global_count` gauge for observed actions within the limit window
  - `global_limit_exceeded` counter for rejected actions beyond the global limit

## Detection
- Rising queue depth metrics or alerts.
- Consumers lagging or timing out.
- Dashboard shows message age exceeding 30 s.
- `queueLag` metric remains above 10 s for 5 m.
- `ws_outbound_queue_max` > 80 for 1 m.
- `game_action_global_limit` (=30 actions/10 s by default) approached or exceeded.
 - `global_limit_exceeded` rising above zero.

## Configured Limits
- `ws_outbound_queue_limit` = 100 messages per socket (drops beyond this)
- `game_action_global_limit` = 30 actions per 10 s cluster-wide

## When to page
Page according to the [SLO error-budget policy](../SLOs.md#error-budget-handling) when queue lag burns budget faster than thresholds.

## Playbook
1. Inspect worker logs for processing errors.
2. Scale up consumers or purge poisoned messages.
3. Verify upstream services (database, cache) are healthy.
4. If backlog persists, run `scripts/queue-drain.sh <queue>` and enable rate limiting on producers.

Refer to [Error Budget Procedures](../error-budget-procedures.md) when saturation burns budget quickly.

## CI Regression Check
`scripts/check-backpressure.ts` runs the socket-load harness and fails when
`ws_outbound_queue_depth` exceeds 80 messages or when global action counters hit
their configured limit. The job writes `metrics/backpressure.json` for
inspection.

## Verification
- Queue depth returns to normal operating levels.
- No new saturation alerts for 15 m.
- `queueLag` metric falls below 2 s.

## Alerting
- Route: [`pokerhub-eng`](../../metrics/alert-routes.md#pokerhub-eng) (PagerDuty ID: PENG012)
- Escalation: [Engineering](https://pokerhub.pagerduty.com/escalation_policies/PDEF456)
- Alert threshold: `ws_outbound_queue_max` ≥ 80 for 1 m triggers `WS Outbound Queue Saturation`.
- Alert threshold: `global_limit_exceeded` / `game_action_global_count` > 5% for 5 m triggers `Global Rate Limit Exceeded`.

## Drill
- Simulated monthly with `load/chaos/artillery-packet-loss.yml`.
