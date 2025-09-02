#!/usr/bin/env bash
set -euo pipefail

ENV=${DEPLOY_ENV:-}
if [[ "$ENV" != "staging" && "$ENV" != "production" ]]; then
  echo "DEPLOY_ENV must be set to staging or production"
  exit 1
fi
NAMESPACE=${K8S_NAMESPACE:-$ENV}
RELEASE=${CANARY_RELEASE:-canary}
DEPLOYMENT=${CANARY_DEPLOYMENT:-api-canary}

echo "Rolling back canary deployment in $ENV..."
if ! helm rollback "$RELEASE" --namespace "$NAMESPACE" 2>/dev/null; then
  kubectl -n "$NAMESPACE" rollout undo deployment/"$DEPLOYMENT" || true
fi

if [[ -n "${METRICS_URL:-}" && -n "${ERROR_RATE_THRESHOLD:-}" ]]; then
  "$(dirname "$0")/check-metrics.sh"
fi

echo "Canary rollback complete for $ENV"

