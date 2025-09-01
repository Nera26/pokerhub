# Test Strategy

## Property-Based Tests

Property-based tests leverage [`fast-check`](https://github.com/dubzzz/fast-check) to exercise game logic across a large range of generated inputs. They run in the dedicated **property** stage of the CI pipeline (see `.github/workflows/ci.yml`) and help surface edge-case bugs early.

### Running locally

```bash
npm test --prefix backend -- test/game/.*\.property\.spec\.ts
```

## CI Load Checks

The `load` stage of `.github/workflows/ci.yml` runs `load/k6-swarm.js` against the staging cluster. `load/check-thresholds.sh` fails the build if p95 acknowledgement latency or error rates breach thresholds. A scheduled soak test is handled separately by `.github/workflows/soak.yml`.

## Socket Load Harness

`tests/performance/socket-load.ts` simulates websocket clients performing actions across many tables. It records per-table latency and action rates and exports a TPS metric via OpenTelemetry.

### Running

```bash
docker run -d --name toxiproxy -p 8474:8474 -p 3001:3001 ghcr.io/shopify/toxiproxy
TABLES=10000 SOCKETS=80000 npm run perf:socket-load
```

The test writes metrics to `metrics/table-metrics.json` and fails when:

- p50 ACK latency > 40 ms
- p95 ACK latency > 120 ms
- p99 ACK latency > 200 ms
- average actions per table per minute < 150

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

## Tournament

The `backend/tests/performance/tournament-10k.ts` script seeds 10 k players and runs the tournament scheduler and table balancer end-to-end. It asserts the total runtime stays within 5 % of a warmed baseline and that final payouts align with Independent Chip Model results within one chip.

`npm test --prefix backend` also runs `backend/test/tournament/mega-sim.spec.ts`, which loads the documented blind structures to simulate a 10 k-player MTT. The test converts elapsed execution time to minutes using the handbook's 130‑minute target and asserts the result stays within ±5 % while comparing final payouts against `calculateIcmPayouts`.

### Running locally

```bash
npx ts-node -P backend/tsconfig.json backend/tests/performance/tournament-10k.ts
```
