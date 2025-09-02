# Gateway Metrics

The game WebSocket gateway exposes metrics for outbound queue health and rate limits.

## Metrics

- `ws_outbound_queue_depth` – observable gauge reporting the current queue
  depth for each socket.
- `ws_outbound_queue_max` – observable gauge exporting the peak queue depth per
  socket within a scrape window.
- `ws_outbound_queue_threshold` – observable gauge exposing the configured
  queue depth threshold used for alerts (defaults to 80 messages).
- `ws_outbound_dropped_total` – counter of messages dropped when a socket queue
  is full.
- `game_action_global_count` – observable gauge tracking the number of actions
  processed within the global rate‑limit window.
- `game_action_global_limit` – observable gauge exposing the configured global
  action limit.
- `per_socket_limit_exceeded` – counter tagged with `socketId` for actions
  rejected due to the per-socket rate limit.
- `global_limit_exceeded` – counter tagged with `socketId` for actions rejected
  due to the global rate limit.
- `http_request_duration_p50_ms`, `http_request_duration_p95_ms`,
  `http_request_duration_p99_ms` – observable gauges exporting HTTP request
  latency percentiles.
- `http_request_throughput` – observable gauge reporting per‑second HTTP
  request throughput.

### Threshold interpretation

`ws_outbound_queue_threshold` reflects the configured alert boundary for queue
depth. When `ws_outbound_queue_depth` approaches this value, sockets are close
to saturation and may start dropping frames. The global action limit is exposed
via the `game_action_global_limit` gauge; a rising `global_limit_exceeded`
counter indicates actions are being rejected beyond this rate. The high-traffic
regression test [`backend/test/game/outbound-queue.threshold.spec.ts`]
(../backend/test/game/outbound-queue.threshold.spec.ts) parses these metrics and fails if
either value exceeds its threshold.

## Dashboards

- **Queue Saturation** – [Grafana dashboard `queue-saturation`](https://grafana.pokerhub.example/d/queue-saturation)
  visualizes `ws_outbound_queue_depth` and the per-socket peak
  `ws_outbound_queue_max`.
- **Backend Overview** – includes `game_action_global_count` and rate limit
  violations to track player actions.

## Alert Rules

- **HighOutboundQueueDepth** – fires when `ws_outbound_queue_max` exceeds
  `ws_outbound_queue_threshold` (80 messages) for 5 m.
- **DroppedWsMessages** – fires when any `ws_outbound_dropped_total` is
  observed (>0 for 1 m).
- **GlobalRateLimitExceeded** – fires when `global_limit_exceeded` /
  `game_action_global_count` > 5% for 5 m.
- **PerSocketRateLimitExceeded** – fires when
  `per_socket_limit_exceeded` / `game_action_global_count` > 5% for 5 m.

These metrics help surface saturation and abusive clients before they impact
live games.

## CI Thresholds

The `perf` workflow runs `load/soak.js` and fails when performance falls outside
the following limits:

- Ack latency p95 < 120 ms
- Ack latency p99 < 200 ms
- Error rate < 1%
- CPU usage p95 < 80%
- GC pause p95 < 50 ms
- Heap usage p95 < 1024 MB

These bounds are enforced by `load/check-thresholds.sh` and guard against
regressions in request latency and resource consumption.
