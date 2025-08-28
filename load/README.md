# Load Testing Scenarios

This directory contains WebSocket load test scripts for PokerHub.

- `k6-ws-packet-loss.js` – k6 scenario establishing 10k sockets and simulating packet loss.
- `artillery-ws-packet-loss.yml` – Artillery scenario with equivalent behavior via a processor.

Both scripts assume the server is reachable via `ws://localhost:3000` by default.
Environment variables:
- `WS_URL` – override the WebSocket URL.
- `VUS` / `DURATION` – control k6 virtual users and duration.
- `PACKET_LOSS` – probability (0-1) for dropping a packet.

Smoke tests can be run with reduced users and duration, e.g.:

```sh
k6 run --vus 10 --duration 10s load/k6-ws-packet-loss.js
artillery run load/artillery-ws-packet-loss.yml --overrides '{"phases":[{"duration":10,"arrivalRate":10}]}'
```
