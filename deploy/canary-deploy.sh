#!/usr/bin/env bash
set -euo pipefail

APP_NAME=${APP_NAME:-pokerhub}
IMAGE_TAG=${IMAGE_TAG:-latest}
ARTIFACT_REGISTRY=${ARTIFACT_REGISTRY:?ARTIFACT_REGISTRY env var must be set}
IMAGE=${IMAGE:-${ARTIFACT_REGISTRY}/${APP_NAME}:${IMAGE_TAG}}
NAMESPACE=${NAMESPACE:-default}
CANARY_DEPLOYMENT=${CANARY_DEPLOYMENT:-${APP_NAME}-canary}
STABLE_DEPLOYMENT=${STABLE_DEPLOYMENT:-${APP_NAME}}
HEALTH_CHECK_URL=${HEALTH_CHECK_URL:-http://${CANARY_DEPLOYMENT}:80/health}

rollback() {
  echo "Rolling back canary deployment"
  HEALTH_CHECK_URL="http://${CANARY_DEPLOYMENT}:80/health" "$(dirname "$0")/rollback.sh" --canary "$APP_NAME" || true
  echo "Rolling back stable deployment"
  HEALTH_CHECK_URL="http://${STABLE_DEPLOYMENT}:80/health" "$(dirname "$0")/rollback.sh" "$APP_NAME" || true
}
trap rollback ERR

echo "Deploying canary ${CANARY_DEPLOYMENT} with image ${IMAGE}"
kubectl set image deployment/"${CANARY_DEPLOYMENT}" "${APP_NAME}"="${IMAGE}" -n "$NAMESPACE"
kubectl rollout status deployment/"${CANARY_DEPLOYMENT}" -n "$NAMESPACE" --timeout=60s

echo "Running database migrations"
kubectl exec deployment/"${CANARY_DEPLOYMENT}" -n "$NAMESPACE" -- npm run migration:run

echo "Verifying canary health"
kubectl run "${APP_NAME}"-probe --rm -i --restart=Never --image=curlimages/curl:8.6.0 -n "$NAMESPACE" -- \
  curl -fsS "$HEALTH_CHECK_URL"

echo "Promoting canary to ${STABLE_DEPLOYMENT}"
kubectl set image deployment/"${STABLE_DEPLOYMENT}" "${APP_NAME}"="${IMAGE}" -n "$NAMESPACE"
kubectl rollout status deployment/"${STABLE_DEPLOYMENT}" -n "$NAMESPACE" --timeout=60s

trap - ERR
echo "Canary deployment complete"
