#!/usr/bin/env bash
set -euo pipefail

APP_NAME=${1:-pokerhub}
NAMESPACE=${NAMESPACE:-default}

echo "Rolling back deployment/$APP_NAME"
kubectl rollout undo deployment/$APP_NAME -n "$NAMESPACE"
