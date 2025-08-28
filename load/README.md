# Load Testing Scenarios

This directory contains WebSocket load test scripts for PokerHub.

- `k6-ws-packet-loss.js` – k6 scenario establishing 10k sockets and simulating packet loss.
- `artillery-ws-packet-loss.yml` – Artillery scenario with equivalent behavior via a processor.
- `k6-ws-soak.js` – 24h k6 soak test emulating 80k sockets across 10k tables with 5% packet loss and 200 ms jitter. Deterministic runs are achieved via a seed and the script checks memory leak (<1%) and GC pause p95 (<50 ms) using a metrics endpoint.

All scripts assume the server is reachable via `ws://localhost:3000` by default.
Environment variables:
- `WS_URL` – override the WebSocket URL.
- `SOCKETS` / `TABLES` – number of sockets (clients) and tables to simulate.
- `DURATION` – k6 test duration (default `24h` for soak script).
- `PACKET_LOSS` – probability (0-1) for dropping a packet.
- `JITTER_MS` – max network jitter in milliseconds.
- `RNG_SEED` – seed for deterministic replay.
- `METRICS_URL` – HTTP endpoint returning `{ heapUsed, gcPauseP95 }` for leak/GC checks.

Smoke tests can be run with reduced users and duration, e.g.:

```sh
k6 run --vus 10 --duration 10s load/k6-ws-packet-loss.js
artillery run load/artillery-ws-packet-loss.yml --overrides '{"phases":[{"duration":10,"arrivalRate":10}]}'
# Soak script quick check
k6 run -e SOCKETS=100 -e TABLES=10 -e DURATION=30s load/k6-ws-soak.js
```
