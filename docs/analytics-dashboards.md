# Analytics Dashboards

JSON exports for core operational metrics. Import these into Grafana or Metabase to visualize latency, error rate, socket connect success, and queue saturation.

## Grafana

### Action ACK Latency
```json
{
  "title": "Action ACK Latency",
  "panels": [
    {
      "type": "timeseries",
      "targets": [
        { "expr": "histogram_quantile(0.95, sum(rate(ack_latency_bucket[5m])) by (le))" }
      ]
    }
  ]
}
```

### Error Rate
```json
{
  "title": "Error Rate",
  "panels": [
    {
      "type": "timeseries",
      "targets": [
        { "expr": "sum(rate(request_errors_total[5m])) / sum(rate(requests_total[5m]))" }
      ]
    }
  ]
}
```

### Socket Connect Success
```json
{
  "title": "Socket Connect Success",
  "panels": [
    {
      "type": "stat",
      "targets": [
        { "expr": "sum(rate(socket_connect_success_total[5m])) / sum(rate(socket_connect_attempts_total[5m]))" }
      ]
    }
  ]
}
```

### Queue Saturation
```json
{
  "title": "Queue Saturation",
  "panels": [
    {
      "type": "timeseries",
      "targets": [
        { "expr": "queue_lag_seconds" }
      ]
    }
  ]
}
```

### Redis Command Latency
```json
{
  "title": "Redis Command Latency",
  "panels": [
    {
      "type": "timeseries",
      "targets": [
        { "expr": "histogram_quantile(0.95, sum(rate(redis_client_cmd_duration_seconds_bucket[5m])) by (le))" }
      ],
      "fieldConfig": { "defaults": { "unit": "s" } }
    }
  ],
  "tags": { "pagerduty_service": "pokerhub-sre" }
}
```

### Postgres Query Duration
```json
{
  "title": "Postgres Query Duration",
  "panels": [
    {
      "type": "timeseries",
      "targets": [
        { "expr": "histogram_quantile(0.95, sum(rate(db_query_duration_seconds_bucket[5m])) by (le))" }
      ],
      "fieldConfig": { "defaults": { "unit": "s" } }
    }
  ],
  "tags": { "pagerduty_service": "pokerhub-sre" }
}
```

### WebSocket Message Rate
```json
{
  "title": "WebSocket Message Rate",
  "panels": [
    {
      "type": "stat",
      "targets": [
        { "expr": "sum(rate(game_action_global_count[1m]))" }
      ]
    }
  ],
  "tags": { "pagerduty_service": "pokerhub-sre" }
}
```

### Frontend Route Latency
```json
{
  "title": "Frontend Route Latency",
  "panels": [
    {
      "type": "timeseries",
      "targets": [
        {
          "expr": "histogram_quantile(0.95, sum(rate(frontend_route_duration_seconds_bucket[5m])) by (le,route))"
        }
      ],
      "fieldConfig": { "defaults": { "unit": "s" } }
    }
  ],
  "tags": { "pagerduty_service": "pokerhub-eng" }
}
```

### Frontend Error Rate
```json
{
  "title": "Frontend Error Rate",
  "panels": [
    {
      "type": "stat",
      "targets": [
        {
          "expr": "sum(rate(frontend_errors_total[5m])) / sum(rate(frontend_requests_total[5m]))"
        }
      ]
    }
  ],
  "tags": { "pagerduty_service": "pokerhub-eng" }
}
```

### Telemetry Overview
```json
{
  "title": "Latency & Error Overview",
  "panels": [
    { "title": "HTTP p95 Latency" },
    { "title": "Request Error Rate" },
    { "title": "CPU Usage" }
  ]
}
```

## Metabase

### Action ACK Latency
```json
{
  "name": "Action ACK Latency",
  "dataset_query": {
    "type": "native",
    "native": {
      "query": "SELECT percentile_cont(0.95) WITHIN GROUP (ORDER BY ack_latency_ms) AS p95 FROM action_metrics WHERE created_at > now() - interval '1 hour'"
    }
  }
}
```

### Error Rate
```json
{
  "name": "Error Rate",
  "dataset_query": {
    "type": "native",
    "native": {
      "query": "SELECT sum(error_count)/sum(request_count) AS error_rate FROM request_metrics WHERE created_at > now() - interval '1 hour'"
    }
  }
}
```

### Socket Connect Success
```json
{
  "name": "Socket Connect Success",
  "dataset_query": {
    "type": "native",
    "native": {
      "query": "SELECT sum(success)/sum(attempts) AS connect_success FROM socket_connect_metrics WHERE created_at > now() - interval '1 hour'"
    }
  }
}
```

### Queue Saturation
```json
{
  "name": "Queue Saturation",
  "dataset_query": {
    "type": "native",
    "native": {
      "query": "SELECT avg(queue_lag_seconds) FROM queue_metrics WHERE created_at > now() - interval '1 hour'"
    }
  }
}
```

### Telemetry Overview
```json
{
  "name": "Latency & Error Overview",
  "dataset_query": {
    "type": "native",
    "native": { "query": "SELECT 1" }
  }
}
```
