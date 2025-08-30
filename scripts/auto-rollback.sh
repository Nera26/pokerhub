#!/usr/bin/env bash
set -euo pipefail

ENV=${DEPLOY_ENV:-}
if [[ "$ENV" != "staging" && "$ENV" != "production" ]]; then
  echo "DEPLOY_ENV must be set to staging or production"
  exit 1
fi

HEALTH=${HEALTH_CHECK_URL:-}
if [[ -z "$HEALTH" ]]; then
  echo "HEALTH_CHECK_URL must be set"
  exit 1
fi

echo "Checking canary health on $ENV..."
if ! curl -fsS "$HEALTH" > /dev/null; then
  echo "Health check failed, rolling back deployment in $ENV"
  # placeholder rollback logic
  # e.g., kubectl rollout undo deployment/my-app
  exit 1
fi

echo "Canary healthy, no rollback required"
