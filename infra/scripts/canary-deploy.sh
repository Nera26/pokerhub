#!/usr/bin/env bash
set -euo pipefail

NAMESPACE=${NAMESPACE:-default}
SERVICE=${SERVICE:-api}
STABLE=${STABLE:-api}
CANARY=${CANARY:-api-canary}
CANARY_TRAFFIC_PERCENT=${CANARY_TRAFFIC_PERCENT:-5}
CANARY_DURATION_MINUTES=${CANARY_DURATION_MINUTES:-30}
SLO_BURN_THRESHOLD=${SLO_BURN_THRESHOLD:-0.01}
PROMETHEUS=${PROMETHEUS:-http://prometheus.monitoring.svc.cluster.local:9090}
SLO_QUERY=${SLO_QUERY:-"sum(rate(http_request_errors_total{service=\"${CANARY}\"}[5m]))"}

route_traffic() {
  kubectl -n "$NAMESPACE" apply -f - <<PATCH
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: ${SERVICE}
spec:
  hosts:
  - ${SERVICE}
  http:
  - route:
    - destination:
        host: ${STABLE}
      weight: $((100 - CANARY_TRAFFIC_PERCENT))
    - destination:
        host: ${CANARY}
      weight: ${CANARY_TRAFFIC_PERCENT}
PATCH
}

promote_canary() {
  kubectl -n "$NAMESPACE" apply -f - <<PATCH
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: ${SERVICE}
spec:
  hosts:
  - ${SERVICE}
  http:
  - route:
    - destination:
        host: ${CANARY}
      weight: 100
PATCH
}

rollback() {
  echo "Rolling back canary"
  kubectl -n "$NAMESPACE" rollout undo deployment "$CANARY" || true
  kubectl -n "$NAMESPACE" apply -f - <<PATCH
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: ${SERVICE}
spec:
  hosts:
  - ${SERVICE}
  http:
  - route:
    - destination:
        host: ${STABLE}
      weight: 100
PATCH
}

trap rollback ERR

echo "Routing ${CANARY_TRAFFIC_PERCENT}% traffic to ${CANARY} for ${CANARY_DURATION_MINUTES} minutes"
route_traffic

end=$((SECONDS + CANARY_DURATION_MINUTES * 60))
while [ $SECONDS -lt $end ]; do
  burn=$(curl -s "${PROMETHEUS}/api/v1/query?query=${SLO_QUERY}" | jq -r '.data.result[0].value[1]' 2>/dev/null || echo 0)
  awk -v burn="$burn" -v thr="$SLO_BURN_THRESHOLD" 'BEGIN{exit (burn>thr)}' || { echo "SLO burn $burn > $SLO_BURN_THRESHOLD"; exit 1; }
  sleep 60
done

trap - ERR
echo "Promoting canary to 100% traffic"
promote_canary
