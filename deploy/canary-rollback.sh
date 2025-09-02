#!/usr/bin/env bash
set -euo pipefail

APP_NAME=${APP_NAME:-pokerhub}
NAMESPACE=${NAMESPACE:-default}
STABLE_DEPLOYMENT=${STABLE_DEPLOYMENT:-${APP_NAME}}
CANARY_DEPLOYMENT=${CANARY_DEPLOYMENT:-${APP_NAME}-canary}

echo "Rolling back canary deployment ${CANARY_DEPLOYMENT}"
kubectl rollout undo deployment/"${CANARY_DEPLOYMENT}" -n "$NAMESPACE" || true

echo "Rolling back stable deployment ${STABLE_DEPLOYMENT}"
kubectl rollout undo deployment/"${STABLE_DEPLOYMENT}" -n "$NAMESPACE" || true

echo "Rollback complete"
