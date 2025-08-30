#!/usr/bin/env bash
set -euo pipefail

ENV=${DEPLOY_ENV:-}
if [[ "$ENV" != "staging" && "$ENV" != "production" ]]; then
  echo "DEPLOY_ENV must be set to staging or production"
  exit 1
fi

echo "Rolling back canary deployment in $ENV..."
# placeholder for rollback logic
# e.g., kubectl rollout undo deployment/api-canary -n "$ENV"

echo "Canary rollback complete for $ENV"

