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

echo "Starting canary deployment to $ENV..."
# placeholder for deployment logic
# e.g., kubectl apply -f k8s/

echo "Checking metrics before promotion..."
"$(dirname "$0")/check-metrics.sh"

echo "Canary deployment triggered for $ENV"
