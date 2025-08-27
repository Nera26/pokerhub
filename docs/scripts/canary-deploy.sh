#!/usr/bin/env bash
set -euo pipefail

IMAGE=${IMAGE:-ghcr.io/$GITHUB_REPOSITORY/room-worker:$GITHUB_SHA}

docker build -t "$IMAGE" .
echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_ACTOR" --password-stdin
docker push "$IMAGE"

kubectl apply -f infra/tests/load/k8s-room-workers.yaml
kubectl set image deployment/room-worker room-worker="$IMAGE" --record
kubectl rollout status deployment/room-worker --timeout=120s

if ! k6 run infra/tests/load/k6-room-workers.js --summary-export=summary.json; then
  kubectl rollout undo deployment/room-worker
  exit 1
fi
