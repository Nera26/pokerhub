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

echo "Checking canary deployment on $ENV via $HEALTH..."
if curl -fsS "$HEALTH" >/dev/null; then
  echo "Canary is healthy"
else
  echo "Canary health check failed"
  exit 1
fi
