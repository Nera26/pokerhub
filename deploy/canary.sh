#!/usr/bin/env bash
set -euo pipefail

# Authenticate to GKE before running. For local development run:
#   gcloud auth login
# or rely on Workload Identity in CI. Ensure the kube-context is set via:
#   gcloud container clusters get-credentials CLUSTER_NAME --zone ZONE --project PROJECT_ID

usage() {
  echo "Usage: $0 --image IMAGE [--namespace NAMESPACE] [--health-url URL]" >&2
  exit 1
}

IMAGE=""
NAMESPACE="${NAMESPACE:-default}"
APP_NAME="${APP_NAME:-pokerhub}"
CANARY_DEPLOYMENT="${CANARY_DEPLOYMENT:-${APP_NAME}-canary}"
STABLE_DEPLOYMENT="${STABLE_DEPLOYMENT:-${APP_NAME}}"
HEALTH_CHECK_URL=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -i|--image)
      IMAGE="$2"
      shift 2
      ;;
    -n|--namespace)
      NAMESPACE="$2"
      shift 2
      ;;
    -u|--health-url)
      HEALTH_CHECK_URL="$2"
      shift 2
      ;;
    -h|--help)
      usage
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      ;;
  esac
done

if [[ -z "$IMAGE" ]]; then
  echo "--image is required" >&2
  usage
fi

if [[ -z "$HEALTH_CHECK_URL" ]]; then
  HEALTH_CHECK_URL="http://${CANARY_DEPLOYMENT}:80/health"
fi

export APP_NAME NAMESPACE STABLE_DEPLOYMENT CANARY_DEPLOYMENT

rollback() {
  echo "Rolling back canary deployment"
  "$(dirname "$0")/canary-rollback.sh" || true
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

