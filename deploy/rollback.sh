#!/usr/bin/env bash
set -euo pipefail

# Authenticate to GKE before running. For local development run:
#   gcloud auth login
# or rely on Workload Identity in CI. Ensure the kube-context is set via:
#   gcloud container clusters get-credentials CLUSTER_NAME --zone ZONE --project PROJECT_ID

usage() {
  echo "Usage: $0 [--app APP_NAME] [--namespace NAMESPACE] [--health-url URL] [--canary]" >&2
  exit 1
}

APP_NAME=${APP_NAME:-pokerhub}
NAMESPACE=${NAMESPACE:-default}
HEALTH_CHECK_URL=${HEALTH_CHECK_URL:-}
CANARY=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --app|-a)
      APP_NAME="$2"
      shift 2
      ;;
    --namespace|-n)
      NAMESPACE="$2"
      shift 2
      ;;
    --health-url|-u)
      HEALTH_CHECK_URL="$2"
      shift 2
      ;;
    --canary)
      CANARY=true
      shift
      ;;
    -h|--help)
      usage
      ;;
    *)
      APP_NAME="$1"
      shift
      ;;
  esac
done

STABLE_DEPLOYMENT=${STABLE_DEPLOYMENT:-$APP_NAME}
CANARY_DEPLOYMENT=${CANARY_DEPLOYMENT:-${APP_NAME}-canary}

if $CANARY; then
  echo "Rolling back canary deployment ${CANARY_DEPLOYMENT}"
  kubectl rollout undo deployment/"${CANARY_DEPLOYMENT}" -n "$NAMESPACE" || true
  kubectl rollout status deployment/"${CANARY_DEPLOYMENT}" -n "$NAMESPACE" || true
  echo "Rolling back stable deployment ${STABLE_DEPLOYMENT}"
  kubectl rollout undo deployment/"${STABLE_DEPLOYMENT}" -n "$NAMESPACE" || true
  kubectl rollout status deployment/"${STABLE_DEPLOYMENT}" -n "$NAMESPACE" || true
else
  echo "Rolling back deployment/${STABLE_DEPLOYMENT}"
  kubectl rollout undo deployment/"${STABLE_DEPLOYMENT}" -n "$NAMESPACE"
  kubectl rollout status deployment/"${STABLE_DEPLOYMENT}" -n "$NAMESPACE"
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
