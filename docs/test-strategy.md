# Test Strategy

## Table Action Load Test

The `infra/tests/load/k6-table-actions.js` script simulates action traffic across 10k tables. It records an `ack_latency` histogram for each action acknowledgement.

### Running in CI

A GitHub workflow named `table-actions-clickhouse` runs the scenario against the staging cluster with optional network impairment and exports metrics to ClickHouse.

1. Open **Actions** → **table-actions-clickhouse**.
2. Choose **Run workflow** and set:
   - `tables` – number of simulated tables (default `10000`).
   - `players` – number of websocket connections (default `80000`).
   - `packet_loss` – probability between `0` and `1` (default `0.05`).
   - `jitter_ms` – injected latency in milliseconds (default `200`).
3. The workflow proxies traffic through Toxiproxy to inject packet loss and jitter and uploads latency metrics to ClickHouse via `xk6-output-clickhouse`.

Artifacts `table-actions-summary.json` and `table-actions-telemetry.json` are published for further analysis.

### Running locally

```bash
docker run -d --name toxiproxy -p 8474:8474 -p 3001:3001 ghcr.io/shopify/toxiproxy
PACKET_LOSS=0.05 LATENCY_MS=200 UPSTREAM=staging.pokerhub:80 ./load/toxiproxy.sh
TABLES=10000 SOCKETS=80000 k6 run infra/tests/load/k6-table-actions.js \
  --summary-export=summary.json \
  --out xk6-clickhouse=$CLICKHOUSE_DSN
```

Latency histograms are stored under the `ack_latency` metric in ClickHouse for query and dashboarding.
