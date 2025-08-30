#!/usr/bin/env bash
set -euo pipefail

REDIS_HOST=${REDIS_HOST:-localhost}
REDIS_PORT=${REDIS_PORT:-6379}
BACKEND_URL=${BACKEND_URL:-http://localhost:4000}
WS_URL=${WS_URL:-ws://localhost:4000/game}

wait_for_port() {
  local host="${1%:*}"
  local port="${1#*:}"
  until nc -z "$host" "$port"; do
    sleep 1
  done
}

echo "Waiting for Redis at $REDIS_HOST:$REDIS_PORT..."
wait_for_port "$REDIS_HOST:$REDIS_PORT"

echo "Waiting for backend API at $BACKEND_URL/health..."
until curl -sf "$BACKEND_URL/health" >/dev/null 2>&1; do
  sleep 1
done

WS_HOST=$(echo "$WS_URL" | sed -E 's#^ws://([^/:]+).*#\1#')
WS_PORT=$(echo "$WS_URL" | sed -E 's#^ws://[^/:]+:([0-9]+).*#\1#')
WS_PORT=${WS_PORT:-80}

echo "Waiting for game gateway at $WS_HOST:$WS_PORT..."
wait_for_port "$WS_HOST:$WS_PORT"

echo "Starting k6 run $*"
exec k6 run "$@"
