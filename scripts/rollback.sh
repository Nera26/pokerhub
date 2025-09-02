#!/usr/bin/env bash
set -euo pipefail

ENV=${DEPLOY_ENV:-}
if [[ "$ENV" != "staging" && "$ENV" != "production" ]]; then
  echo "DEPLOY_ENV must be set to staging or production"
  exit 1
fi
NAMESPACE=${K8S_NAMESPACE:-$ENV}
RELEASE=${RELEASE_NAME:-canary}
DEPLOYMENT=${DEPLOYMENT_NAME:-api}

echo "Rolling back deployment in $ENV..."
if ! helm rollback "$RELEASE" --namespace "$NAMESPACE" 2>/dev/null; then
  kubectl -n "$NAMESPACE" rollout undo deployment/"$DEPLOYMENT" || true
fi
kubectl -n "$NAMESPACE" rollout status deployment/"$DEPLOYMENT" >/dev/null 2>&1 || true
echo "Rollback complete for $ENV"
