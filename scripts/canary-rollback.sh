#!/usr/bin/env bash
set -euo pipefail

ENV=${DEPLOY_ENV:-}
if [[ "$ENV" != "staging" && "$ENV" != "production" ]]; then
  echo "DEPLOY_ENV must be set to staging or production"
  exit 1
fi

METRICS_URL=${METRICS_URL:-}
ERROR_RATE_THRESHOLD=${ERROR_RATE_THRESHOLD:-}
if [[ -z "$METRICS_URL" || -z "$ERROR_RATE_THRESHOLD" ]]; then
  echo "METRICS_URL and ERROR_RATE_THRESHOLD must be set"
  exit 1
fi

echo "Rolling back canary deployment in $ENV..."
# placeholder for rollback logic
# e.g., kubectl rollout undo deployment/api-canary -n "$ENV"

echo "Checking metrics after rollback..."
"$(dirname "$0")/check-metrics.sh"

echo "Canary rollback complete for $ENV"

