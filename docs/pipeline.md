# CI/CD Pipeline

PokerHub uses a multi‑stage GitHub Actions pipeline to gate changes before release.

## Test Stages

1. **Contracts** – runs `npm run test:contracts` for backend and frontend to ensure the OpenAPI contract matches implementation.
2. **Unit** – installs dependencies for backend and frontend, runs eslint, unit tests and verifies OpenAPI drift.
3. **Property** – runs fast‑check powered property tests for backend and frontend along with shared type checks.
4. **Integration** – runs backend API e2e tests and frontend integration tests.
5. **E2E** – exercises full end‑to‑end flows with Playwright.
6. **Load** – smoke runs a websocket load scenario with k6.
7. **Chaos** – runs `load/chaos/ws-chaos.js` to inject packet loss and jitter during a short k6 run.

All stages run on every pull request and failures block merging.

## Contract & Code Quality Gates

`ci.yml` includes a dedicated contract‑check job that invokes `npm run test:contracts` for both backend and frontend. The separate
`contracts.yml` workflow validates OpenAPI ↔ Zod alignment and enforces
frontend/backend approvals for contract changes. A lightweight
[`contract-tests.yml`](../.github/workflows/contract-tests.yml) workflow also
runs `npm run test:contracts` for both apps on every pull request.

## Deployment

`deploy.yml` performs a canary rollout via `deploy/canary.sh`, routing a small
percentage of traffic to the canary. Health checks poll `$HEALTH_CHECK_URL` and query
Prometheus for error‑rate SLOs. If p95 `game_action_ack_latency_ms` exceeds 120 ms or the
HTTP error rate rises above **0.05 %** (configurable via `$ERROR_RATE_THRESHOLD`),
`deploy/rollback.sh` automatically reverts the deployment. Successful runs promote the
canary to 100 % traffic.

[`canary.yml`](../.github/workflows/canary.yml) also checks Prometheus for SLO breaches
after deploying and runs [`deploy/rollback.sh`](../deploy/rollback.sh)
automatically when metrics exceed thresholds. It continues to watch WebSocket ACK latency
using `load/k6-ws-packet-loss.js` and rolls back if the p95 latency breaches the
[250 ms SLO](SLOs.md#slo-targets).

Example environment variables for these checks:

```
METRICS_URL=https://prom.example.com/api/v1/query?query=error_rate
ERROR_RATE_THRESHOLD=0.0005
CANARY_WS_URL=wss://canary.example.com/ws
```

For detailed rollback and canary procedures see `docs/runbooks/deployment.md` and
`docs/runbooks/canary.md`.
