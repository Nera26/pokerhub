#!/usr/bin/env bash
set -euo pipefail

ENV=${DEPLOY_ENV:-}
if [[ "$ENV" != "staging" && "$ENV" != "production" ]]; then
  echo "DEPLOY_ENV must be set to staging or production"
  exit 1
fi

# Map standard variables to those expected by infra/scripts/canary-deploy.sh
export NAMESPACE=${K8S_NAMESPACE:-$ENV}
export SERVICE=${SERVICE:-api}
export STABLE=${STABLE:-api}
export CANARY=${CANARY:-api-canary}
export CANARY_RELEASE=${CANARY_RELEASE:-canary}
export CANARY_TRAFFIC_PERCENT=${CANARY_TRAFFIC_PERCENT:-5}
export CANARY_DURATION_MINUTES=${CANARY_DURATION_MINUTES:-30}
# Use METRICS_URL as Prometheus endpoint if provided
export PROMETHEUS=${PROMETHEUS:-${METRICS_URL:-}}

# Require a health check endpoint for rollout validation
HEALTH=${HEALTH_CHECK_URL:-}
if [[ -z "$HEALTH" ]]; then
  echo "HEALTH_CHECK_URL must be set"
  exit 1
fi
export HEALTH_CHECK_URL="$HEALTH"

# Run database migrations before deployment
npm --prefix backend run migration:run

# Run canary deployment with built-in health checks and automatic rollback
bash infra/scripts/canary-deploy.sh
