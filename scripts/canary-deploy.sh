#!/usr/bin/env bash
set -euo pipefail

ENV=${DEPLOY_ENV:-}
if [[ "$ENV" != "staging" && "$ENV" != "production" ]]; then
  echo "DEPLOY_ENV must be set to staging or production"
  exit 1
fi

echo "Starting canary deployment to $ENV..."
# placeholder for deployment logic
# e.g., kubectl apply -f k8s/

echo "Canary deployment triggered for $ENV"
