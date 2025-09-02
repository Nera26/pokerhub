# Gateway Metrics

The game WebSocket gateway exposes metrics for outbound queue health and rate limits.

## Metrics

- `ws_outbound_queue_depth` – observable gauge reporting the current queue
  depth for each socket.
- `ws_outbound_queue_max` – observable gauge exporting the peak queue depth per
  socket within a scrape window.
- `ws_outbound_queue_threshold` – observable gauge exposing the configured
  queue depth threshold used for alerts.
- `ws_outbound_dropped_total` – counter of messages dropped when a socket queue
  is full.
- `game_action_global_count` – observable gauge tracking the number of actions
  processed within the global rate‑limit window.
- `per_socket_limit_exceeded` – counter tagged with `socketId` for actions
  rejected due to the per-socket rate limit.
- `global_limit_exceeded` – counter tagged with `socketId` for actions rejected
  due to the global rate limit.

## Dashboards

- **Queue Saturation** – Grafana dashboard `queue-saturation` visualizes
  `ws_outbound_queue_depth` and the per-socket peak `ws_outbound_queue_max`.
- **Backend Overview** – includes `game_action_global_count` and rate limit
  violations to track player actions.

## Alert Rules

- **HighOutboundQueueDepth** – fires when `ws_outbound_queue_max` exceeds
  `ws_outbound_queue_threshold` for 5 m.
- **DroppedWsMessages** – fires when `ws_outbound_dropped_total` > 0 for 1 m.
- **GlobalRateLimitExceeded** – fires when the ratio of
  `global_limit_exceeded` to `game_action_global_count` exceeds 5% over 5 m.
- **PerSocketRateLimitExceeded** – fires when `per_socket_limit_exceeded`
  exceeds 5% of `game_action_global_count` over 5 m.

These metrics help surface saturation and abusive clients before they impact
live games.
