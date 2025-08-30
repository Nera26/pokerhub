#!/usr/bin/env bash
set -euo pipefail

ENV=${DEPLOY_ENV:-}
if [[ "$ENV" != "staging" && "$ENV" != "production" ]]; then
  echo "DEPLOY_ENV must be set to staging or production"
  exit 1
fi

echo "Rolling back deployment in $ENV..."
# placeholder rollback logic
# e.g., kubectl rollout undo deployment/my-app -n "$ENV"

echo "Rollback complete for $ENV"
