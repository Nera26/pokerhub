# Test Strategy

## CI Load Checks

The `k6-swarm-ws` workflow in `.github/workflows/k6-swarm-ws.yml` runs `load/k6-swarm.js` and `load/k6-ws-packet-loss.js` against the staging cluster. It records `ack_latency` and `ws_latency` histograms and fails if p95 latency or error rates breach thresholds.

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

## WebSocket Reconnect Test (Pre-release Gate)

The `load/k6-ws-reconnect.js` scenario opens 80k sockets across 10k tables through Toxiproxy configured with 5% packet loss and 200 ms jitter. It records `ack_latency` histograms and a `reconnect_success` rate and fails if p95 ACK latency exceeds 120 ms.

### Running

```bash
docker run -d --name toxiproxy -p 8474:8474 -p 3001:3001 ghcr.io/shopify/toxiproxy
PACKET_LOSS=0.05 LATENCY_MS=200 UPSTREAM=staging.pokerhub:80 ./load/toxiproxy.sh
TABLES=10000 SOCKETS=80000 k6 run load/k6-ws-reconnect.js --summary-export=reconnect-summary.json
```

Releases are blocked if this test reports `reconnect_success` < 0.99 or if p95 ACK latency breaches 120 ms.

## Action Swarm Soak Test

The `load/soak.js` script extends the action swarm to a 24 h soak run. Execute it via:

```bash
npm run soak:test -- -e METRICS_URL=http://staging.pokerhub:3000/metrics
```

Run with `--log-format json` to capture custom metrics:

- `heap_used_bytes` – monitor for <1 % growth to detect leaks.
- `gc_pause_ms` – p95 should stay below 50 ms.

Breaching these thresholds indicates memory or GC regressions requiring investigation.
