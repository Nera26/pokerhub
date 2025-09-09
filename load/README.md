# Load Testing Scenarios

This directory contains load test scripts for PokerHub.

- `k6-ws-packet-loss.js` – k6 scenario establishing 10k sockets and simulating packet loss.
- `artillery-ws-packet-loss.yml` – Artillery scenario with equivalent behavior via a processor.
- `k6-ws-soak.js` – 24h k6 soak test emulating 80k sockets across 10k tables with 5% packet loss and 200 ms jitter. Deterministic runs are achieved via a seed and the script checks memory leak (<1%) and GC pause p95 (<50 ms) using a metrics endpoint.
- `toxiproxy.sh` – configures a Toxiproxy instance injecting packet loss, latency and jitter between clients and the server.
- `toxiproxy-soak.sh` – wrapper around `toxiproxy.sh` with 5% packet loss and 200 ms jitter for soak tests.
- `collect-gc-heap.sh` – polls the metrics endpoint for GC pause and RSS stats, exporting p95 and growth metrics (fails if RSS grows ≥1% or GC pause p95 ≥50 ms).
- `run-10k-chaos.sh` – orchestrates k6 and Artillery runs, capturing ACK latency, GC/heap metrics and RNG seeds under `load/metrics/`.
- `run-ws-soak.sh` – runs the 24 h `k6-ws-soak.js` scenario and records GC pause p95 and RSS growth metrics under `load/metrics/`.
- `k6-10k-tables.js` – k6 WebSocket scenario driving ~80 k sockets across 10 k tables, injecting packet loss and jitter while recording ACK latency. Supports deterministic replays via `RNG_SEED` and outputs histograms under `load/metrics/`. If `REPLAY_FILE` is set, it replays socket messages from the given hand-history JSON.
- `artillery-10k-tables.yml` – Artillery equivalent to `k6-10k-tables.js` that captures per-endpoint latency histograms.
- `k6-10k-tables-clickhouse.js` – k6 scenario for 10k tables and 80 k sockets injecting 5% packet loss and 200 ms jitter, capturing latency histograms and error rates with metrics exported to ClickHouse and deterministic seeds.
- `k6-chaos-swarm.js` – swarm 80 k sockets across 10 k tables; pair with `toxiproxy.sh` for 5 % loss and 200 ms jitter.
- `k6-ws-reconnect.js` – k6 scenario validating reconnect success and ACK latency under Toxiproxy impairments.

All scripts assume the server is reachable via `ws://localhost:4000/game` by default.

The `k6-100k-chaos` GitHub Actions workflow runs the `infra/tests/load/k6-table-actions.js` scenario with `CHAOS_MODE=1`
nightly and uploads the `load/metrics/latest` contents as artifacts.


## Local endpoints

Ensure the following services are running (see `docker-compose.test.yml`):

- Redis: `localhost:6379`
- Backend API: `http://localhost:4000`
- Game gateway: `ws://localhost:4000/game`
- Test user credentials: `user@example.com / secret` (seed with `npm run seed:test-credentials --prefix backend`)
## Thresholds

- ack latency p95 < 120ms
- ack latency p99 < 200ms
- error rate < 1%
- CPU < 80%
- GC pause p95 < 50ms

Environment variables:
- `WS_URL` – override the WebSocket URL (default `ws://localhost:4000/game`).
- `SOCKETS` – number of concurrent clients (default `10 × TABLES` → `100000` for 10k tables, `100` in CI).
- `TABLES` – number of tables to spread sockets across (default `10000`, `100` in CI).
- `DURATION` – k6 test duration (default `5m`, `1m` in CI).
- `PACKET_LOSS` – probability (0-1) for dropping a packet (default `0.05`).
- `JITTER_MS` – max client-side jitter before sending in milliseconds (default `200`).
- `ACK_P95_MS` – fail if ACK latency p95 exceeds this (default `120`).
- `ACK_P99_MS` – fail if ACK latency p99 exceeds this (default `200`).
- `RNG_SEED` – seed for deterministic replay.
- `REPLAY_FILE` – path to hand-history JSON for replay (optional).
- `METRICS_URL` – HTTP endpoint returning `{ heapUsed, gcPauseP95 }` for leak/GC checks.

## Deterministic replay

Each chaos run writes metrics to a timestamped directory under `load/metrics/`
and updates a `load/metrics/latest` symlink. The RNG seed is stored in
`seed.txt` alongside latency histograms and GC statistics. Re-run with the same
seed to deterministically replay a scenario:

```sh
RNG_SEED=$(cat load/metrics/latest/seed.txt) ./load/run-10k-chaos.sh
```

To replay a specific recorded run, pass its metrics directory via `--replay`:

```sh
./load/run-10k-chaos.sh --replay load/metrics/20240101-000000
# or
./load/run-100k-chaos.sh --replay load/metrics/20240101-000000
```

Artifacts written under `load/metrics/` include:

- `ack-per-table.json` – per-table ACK latency histograms (10 ms buckets).
- `ack-histogram.json` – aggregate ACK latency histogram from k6.
- `artillery-latency.json` – HTTP latency histogram from Artillery.
- `gc-heap.log` and `gc-stats.json` – raw and parsed GC/heap metrics.
- `seed.txt` – RNG seed for deterministic replays.

## Chaos swarm run/stop

```sh
# run
./load/toxiproxy.sh
k6 run load/k6-chaos-swarm.js

# stop
toxiproxy-cli delete pokerhub_ws
```

Smoke tests can be run with reduced users and duration, e.g.:

```sh
k6 run --vus 10 --duration 10s load/k6-ws-packet-loss.js
artillery run load/artillery-ws-packet-loss.yml --overrides '{"phases":[{"duration":10,"arrivalRate":10}]}'
# Soak script quick check
k6 run -e SOCKETS=100 -e TABLES=10 -e DURATION=30s load/k6-ws-soak.js
```
