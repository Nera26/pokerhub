#!/usr/bin/env bash
set -euo pipefail

# Authenticate to GKE before running. For local development run:
#   gcloud auth login
# or rely on Workload Identity in CI. Ensure the kube-context is set via:
#   gcloud container clusters get-credentials CLUSTER_NAME --zone ZONE --project PROJECT_ID

APP_NAME=${APP_NAME:-pokerhub}
TARGET_CANARY=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --canary)
      TARGET_CANARY=true
      shift
      ;;
    *)
      APP_NAME="$1"
      shift
      ;;
  esac
done

NAMESPACE=${NAMESPACE:-default}
ARTIFACT_REGISTRY=${ARTIFACT_REGISTRY:-}
HEALTH_CHECK_URL=${HEALTH_CHECK_URL:-}
CANARY_DEPLOYMENT="${APP_NAME}-canary"
DEPLOYMENT="$APP_NAME"
[[ "$TARGET_CANARY" == true ]] && DEPLOYMENT="$CANARY_DEPLOYMENT"

echo "Rolling back deployment/$DEPLOYMENT"
kubectl rollout undo deployment/"$DEPLOYMENT" -n "$NAMESPACE"
kubectl rollout status deployment/"$DEPLOYMENT" -n "$NAMESPACE"

if [[ "$TARGET_CANARY" != true ]]; then
  if kubectl get deployment "$CANARY_DEPLOYMENT" -n "$NAMESPACE" >/dev/null 2>&1; then
    ready=$(kubectl get deployment "$CANARY_DEPLOYMENT" -n "$NAMESPACE" -o jsonpath='{.status.readyReplicas}')
    if [[ "${ready:-0}" -ne 0 ]]; then
      echo "Canary rollback failed: $ready replicas still ready" >&2
      exit 1
    fi
    echo "Canary deployment has no ready replicas"
  fi
fi

if [[ -n "$HEALTH_CHECK_URL" ]]; then
  echo "Verifying service health at $HEALTH_CHECK_URL"
  if curl -fsS "$HEALTH_CHECK_URL" >/dev/null; then
    echo "Rollback verified via health check"
  else
    echo "Rollback health check failed" >&2
    exit 1
  fi
fi
