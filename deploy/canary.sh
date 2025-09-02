#!/usr/bin/env bash
set -euo pipefail

# Authenticate to GKE before running. For local development run:
#   gcloud auth login
# or rely on Workload Identity in CI. Ensure the kube-context is set via:
#   gcloud container clusters get-credentials CLUSTER_NAME --zone ZONE --project PROJECT_ID

APP_NAME=${APP_NAME:-pokerhub}
IMAGE_TAG=${1:-latest}
NAMESPACE=${NAMESPACE:-default}
ARTIFACT_REGISTRY=${ARTIFACT_REGISTRY:?ARTIFACT_REGISTRY env var must be set}
CANARY_SUFFIX="-canary"

rollback() {
  echo "Rolling back $APP_NAME deployment"
  kubectl rollout undo deployment/$APP_NAME -n "$NAMESPACE" || true
}

trap rollback ERR

echo "Deploying canary $APP_NAME$CANARY_SUFFIX with image tag $IMAGE_TAG"
kubectl set image deployment/${APP_NAME}${CANARY_SUFFIX} ${APP_NAME}=${ARTIFACT_REGISTRY}/${APP_NAME}:${IMAGE_TAG} -n "$NAMESPACE"
kubectl rollout status deployment/${APP_NAME}${CANARY_SUFFIX} -n "$NAMESPACE" --timeout=60s

echo "Running database migrations"
kubectl exec deployment/${APP_NAME}${CANARY_SUFFIX} -n "$NAMESPACE" -- npm run migration:run

# basic health check
if ! kubectl run ${APP_NAME}-probe --rm -i --restart=Never --image=curlimages/curl:8.6.0 -n "$NAMESPACE" -- \
  curl -fsS http://${APP_NAME}${CANARY_SUFFIX}:80/health; then
  echo "Canary health check failed"
  exit 1
fi

echo "Promoting canary to production"
kubectl set image deployment/${APP_NAME} ${APP_NAME}=${ARTIFACT_REGISTRY}/${APP_NAME}:${IMAGE_TAG} -n "$NAMESPACE"
kubectl rollout status deployment/${APP_NAME} -n "$NAMESPACE" --timeout=60s
