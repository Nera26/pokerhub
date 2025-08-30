#!/usr/bin/env bash
set -euo pipefail

PROXY_NAME=${PROXY_NAME:-pokerhub_ws}
PROXY_PORT=${PROXY_PORT:-3001}
UPSTREAM=${UPSTREAM:-localhost:4000}
LOSS=${PACKET_LOSS:-0.05}
LATENCY=${LATENCY_MS:-0}
JITTER=${JITTER_MS:-200}

if ! toxiproxy-cli list | grep -q "$PROXY_NAME"; then
  toxiproxy-cli create $PROXY_NAME -l 0.0.0.0:$PROXY_PORT -u $UPSTREAM
fi

for toxic in $(toxiproxy-cli toxic list $PROXY_NAME | awk '{print $1}'); do
  toxiproxy-cli toxic remove $PROXY_NAME -n $toxic
done

toxiproxy-cli toxic add $PROXY_NAME -t latency -n latency -a latency=${LATENCY} -a jitter=${JITTER}
toxiproxy-cli toxic add $PROXY_NAME -t timeout -n packet_loss -a timeout=1 --toxicity=${LOSS}

echo "Proxy $PROXY_NAME listening on :$PROXY_PORT → $UPSTREAM with ${LOSS} loss and ${LATENCY}±${JITTER}ms latency"
