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
  ./contracts/verify-contract.sh
  ./scripts/check-contract-drift.sh
}

run_property() {
  npm ci
  npm install --no-save fast-check >/dev/null 2>&1 || true
  npm test --prefix backend -- test/game/.*\.property\.spec\.ts
  npx ts-node --esm shared/test/verify.property.ts
}

run_integration() {
  npm ci
  npm run test:e2e --prefix backend
  npm run test:e2e:integration --prefix frontend
}

run_load() {
  npm ci
  if ! command -v k6 >/dev/null 2>&1; then
    echo "k6 is required for load tests" >&2
    exit 1
  fi
  k6 run load/k6-swarm.js --vus 10 --duration 10s
}

run_e2e() {
  npm ci
  npm run test:e2e --prefix frontend
}

run_chaos() {
  npm ci
  if ! command -v k6 >/dev/null 2>&1; then
    echo "k6 is required for chaos tests" >&2
    exit 1
  fi
  summary="chaos-summary.json"
  k6 run load/chaos/ws-chaos.js --vus 10 --duration 10s --summary-export="$summary"
  if [[ -f "$summary" ]]; then
    echo "Chaos summary written to $summary"
    if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
      {
        echo "### Chaos summary"
        echo
        echo '```json'
        cat "$summary"
        echo '```'
      } >> "$GITHUB_STEP_SUMMARY"
    fi
    fails=$(jq '.metrics.checks.fails' "$summary" 2>/dev/null || echo 0)
    if [[ "$fails" -gt 0 ]]; then
      echo "Chaos checks failed: $fails" >&2
      exit 1
    fi
  fi
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
  e2e)
    run_e2e
    ;;
  load)
    run_load
    ;;
  chaos)
    run_chaos
    ;;
  *)
    echo "Usage: $0 {unit|property|integration|e2e|load|chaos}" >&2
    exit 1
    ;;
esac
