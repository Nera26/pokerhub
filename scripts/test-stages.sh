#!/usr/bin/env bash
set -euo pipefail

run_unit() {
  npm ci
  npm ci --prefix backend
  npm ci --prefix frontend
  npm run lint --prefix backend
  npm test --prefix backend
  npm run lint --prefix frontend
  npm test --prefix frontend
  npx -y @redocly/openapi-cli@latest lint contracts/openapi.yaml
  npm run test:contracts
  ./contracts/verify-contract.sh
  ./scripts/check-contract-drift.sh
}

run_property() {
  npm ci
  npm install --no-save fast-check >/dev/null 2>&1 || true
  npm test --prefix backend -- test/game/.*\.property\.spec\.ts
  node -r ts-node/register shared/test/verify.property.ts
}

run_integration() {
  npm ci
  npm run test:e2e --prefix backend
  npm run test:e2e:integration --prefix frontend
  npm run test:e2e --prefix frontend
}

run_load() {
  npm ci
  if ! command -v k6 >/dev/null 2>&1; then
    echo "k6 is required for load tests" >&2
    exit 1
  fi
  k6 run load/k6-ws-packet-loss.js --vus 10 --duration 10s
}

case "${1:-}" in
  unit)
    run_unit
    ;;
  property)
    run_property
    ;;
  integration)
    run_integration
    ;;
  load)
    run_load
    ;;
  *)
    echo "Usage: $0 {unit|property|integration|load}" >&2
    exit 1
    ;;
esac
