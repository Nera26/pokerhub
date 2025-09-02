#!/usr/bin/env bash
set -euo pipefail

NAMESPACE=${NAMESPACE:-default}
SERVICE=${SERVICE:-api}
STABLE=${STABLE:-api}
CANARY=${CANARY:-api-canary}
CANARY_RELEASE=${CANARY_RELEASE:-canary}
CANARY_TRAFFIC_PERCENT=${CANARY_TRAFFIC_PERCENT:-5}
CANARY_DURATION_MINUTES=${CANARY_DURATION_MINUTES:-30}
PROMETHEUS=${PROMETHEUS:-http://prometheus.monitoring.svc.cluster.local:9090}

HEALTH_CHECK_URL=${HEALTH_CHECK_URL:-}
if [[ -z "$HEALTH_CHECK_URL" ]]; then
  echo "HEALTH_CHECK_URL must be set"
  exit 1
fi

ACK_LATENCY_THRESHOLD=$(awk '/Action ACK/ {print $4}' docs/slo.md | tr -d 'ms')
ERROR_RATE_THRESHOLD=$(awk '/Overall availability/ {print 100 - $4}' docs/slo.md | tr -d '%' | awk '{print $1/100}')

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
  helm rollback "${CANARY_RELEASE}" || true
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

echo "Deploying canary release ${CANARY_RELEASE}"
helm upgrade --install "${CANARY_RELEASE}" infra/canary/helm --namespace "${NAMESPACE}" >/dev/null

echo "Routing ${CANARY_TRAFFIC_PERCENT}% traffic to ${CANARY} for ${CANARY_DURATION_MINUTES} minutes"
route_traffic

end=$((SECONDS + CANARY_DURATION_MINUTES * 60))
while [ $SECONDS -lt $end ]; do
  if ! curl -fsS "$HEALTH_CHECK_URL" >/dev/null; then
    echo "HTTP health check failed"
    exit 1
  fi
  latency=$(curl -s "${PROMETHEUS}/api/v1/query?query=histogram_quantile(0.95,sum(rate(game_action_ack_latency_ms_bucket{service=\"${CANARY}\"}[5m])) by (le))" | jq -r '.data.result[0].value[1]' 2>/dev/null || echo 0)
  error_rate=$(curl -s "${PROMETHEUS}/api/v1/query?query=sum(rate(http_request_errors_total{service=\"${CANARY}\"}[5m]))" | jq -r '.data.result[0].value[1]' 2>/dev/null || echo 0)
  awk -v l="$latency" -v thr="$ACK_LATENCY_THRESHOLD" 'BEGIN{exit(l<=thr)}' || { echo "Latency $latency ms > $ACK_LATENCY_THRESHOLD ms"; exit 1; }
  awk -v e="$error_rate" -v thr="$ERROR_RATE_THRESHOLD" 'BEGIN{exit(e<=thr)}' || { echo "Error rate $error_rate > $ERROR_RATE_THRESHOLD"; exit 1; }
  sleep 60
done

trap - ERR
echo "Promoting canary to 100% traffic"
promote_canary
