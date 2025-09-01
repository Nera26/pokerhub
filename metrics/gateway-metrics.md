# Gateway Metrics

The game WebSocket gateway exposes metrics for outbound queue health and rate limits.

## Dashboards

- **Queue Saturation** – Grafana dashboard `queue-saturation` visualizes
  `ws_outbound_queue_depth` and the per-socket peak `ws_outbound_queue_max`.
- **Backend Overview** – includes `game_action_global_count` and rate limit
  violations to track player actions.

## Alert Rules

- **HighOutboundQueueDepth** – fires when `ws_outbound_queue_max` ≥ 80 for 5 m.
- **DroppedWsMessages** – fires when `ws_outbound_dropped_total` > 0 for 1 m.
- **GlobalRateLimitExceeded** – fires when the ratio of
  `global_limit_exceeded` to `game_action_global_count` exceeds 5% over 5 m.
- **PerSocketRateLimitExceeded** – fires when `per_socket_limit_exceeded`
  exceeds 5% of `game_action_global_count` over 5 m.

These metrics help surface saturation and abusive clients before they impact
live games.
