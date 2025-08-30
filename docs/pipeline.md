# CI/CD Pipeline

PokerHub uses a multi‑stage GitHub Actions pipeline to gate changes before release.

## Test Stages

1. **Unit** – installs dependencies for backend and frontend, runs eslint, unit tests, contract tests and verifies OpenAPI drift.
2. **Property** – executes fast‑check powered property tests and shared type checks.
3. **Integration** – runs backend API e2e tests and frontend integration tests.
4. **E2E** – exercises full end‑to‑end flows with Playwright.
5. **Load** – smoke runs a websocket load scenario with k6.
6. **Chaos** – runs `load/chaos/ws-chaos.js` to inject packet loss and jitter during a short k6 run.

All stages run on every pull request. `property` and `chaos` are non‑blocking on branches
but are required gates on the `main` branch.

## Contract & Code Quality Gates

`ci.yml` runs `npm run test:contracts` along with eslint for both apps. The separate
`contracts.yml` workflow validates OpenAPI ↔ Zod alignment and enforces
frontend/backed approvals for contract changes.

## Deployment

`deploy.yml` performs a canary rollout via `scripts/canary-deploy.sh`, routing a small
percentage of traffic to the canary. Health checks poll `$HEALTH_CHECK_URL` and Prometheus
metrics. If p95 `game_action_ack_latency_ms` exceeds 120 ms or the HTTP error rate rises
above **0.05 %** (configurable via `$ERROR_RATE_THRESHOLD`), `scripts/rollback.sh`
reverts the deployment. Successful runs promote the canary to 100 % traffic.

[`canary.yml`](../.github/workflows/canary.yml) deploys with [`scripts/canary-rollback.sh`](../scripts/canary-rollback.sh)
and watches WebSocket ACK latency using `load/k6-ws-packet-loss.js`. If the p95 ACK latency
breaches the [250 ms SLO](SLOs.md#slo-targets), the workflow aborts and the rollback script
reverts the release.

For detailed rollback and canary procedures see `docs/runbooks/deployment.md` and
`docs/runbooks/canary.md`.
