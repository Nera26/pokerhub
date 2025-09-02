# CI/CD Pipeline

PokerHub uses a multi‑stage GitHub Actions pipeline to gate changes before release.

## Test Stages

1. **Contracts** – runs `npm run test:contracts` for backend and frontend to ensure the OpenAPI contract matches implementation.
2. **Unit** – installs dependencies for backend and frontend, runs eslint, unit tests and verifies OpenAPI drift.
3. **Property** – `scripts/test-stages.sh property` installs all workspaces and runs backend, frontend, analytics, shared, and repo‑level property tests, generating coverage for analytics and shared modules.
4. **Integration** – `scripts/test-stages.sh integration` executes backend API e2e tests and frontend integration tests.
5. **E2E** – exercises full end‑to‑end flows with Playwright via `scripts/test-stages.sh e2e`.
6. **Load** – `scripts/test-stages.sh load` smoke runs a websocket load scenario with k6 and enforces latency thresholds via `load/check-thresholds.sh`.
7. **Chaos** – `scripts/test-stages.sh chaos` injects packet loss and jitter during a short k6 run and fails if chaos checks trip.
8. **Soak** – runs `load/k6-ws-soak.js` with `load/check-thresholds.sh` and analyzes trends. For long‑running soak runs see `.github/workflows/soak.yml`.

All stages run on every pull request and failures block merging.

## Contract & Code Quality Gates

`ci.yml` includes a dedicated contract‑check job that invokes `npm run test:contracts` for both backend and frontend. The separate
`contracts.yml` workflow validates OpenAPI ↔ Zod alignment and enforces
frontend/backend approvals for contract changes. A lightweight
[`contract-tests.yml`](../.github/workflows/contract-tests.yml) workflow also
runs `npm run test:contracts` for both apps on every pull request.

## Deployment

`deploy.yml` performs a canary rollout via [`deploy/canary.sh`](../deploy/canary.sh), routing a small
percentage of traffic to the canary. After deployment the workflow queries Prometheus for
SLO metrics—p95 `game_action_ack_latency_ms` and HTTP error rate. If p95 latency exceeds
**120 ms** or the error rate rises above **0.05 %** (`$ERROR_RATE_THRESHOLD`),
[`deploy/rollback.sh`](../deploy/rollback.sh) aborts and reverts the rollout. The script runs integration checks to confirm canary pods are removed and health endpoints respond before completing. Successful runs write `outcome=success`, promote the canary to 100 % traffic, and upload the metrics for audit.

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
