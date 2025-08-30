#!/usr/bin/env bash
set -euo pipefail

ENV=${DEPLOY_ENV:-}
if [[ "$ENV" != "staging" && "$ENV" != "production" ]]; then
  echo "DEPLOY_ENV must be set to staging or production"
  exit 1
fi

echo "Promoting deployment in $ENV..."
# placeholder promotion logic
# e.g., kubectl rollout restart deployment/api -n "$ENV"
echo "Promotion complete for $ENV"
