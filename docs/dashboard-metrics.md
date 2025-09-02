# Dashboard Metrics

The dashboard displays high‑level operational metrics sourced from Redis.

- **Online users** (`metrics:online`)
  - Updated whenever a player logs in.
  - Each login adds the user to a short‑lived sorted set. Entries expire after
    five minutes, so the value reflects recently active accounts.

- **Revenue** (`metrics:revenue`)
  - Incremented when hands are settled and rake is collected.
  - Represents the cumulative rake amount committed via the wallet service.

These keys are written by the backend and read by `DashboardService.getMetrics`.
