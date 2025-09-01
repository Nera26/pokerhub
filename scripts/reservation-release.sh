#!/usr/bin/env bash
set -euo pipefail

PLAYER_ID="${1:-}"
if [[ -z "$PLAYER_ID" ]]; then
  echo "Usage: $0 <playerId>" >&2
  exit 1
fi

REDIS_URL="${REDIS_URL:-}"
if [[ -z "$REDIS_URL" ]]; then
  echo "REDIS_URL must be set" >&2
  exit 1
fi

echo "Releasing reservation keys for player $PLAYER_ID..."
KEYS=$(redis-cli -u "$REDIS_URL" KEYS "reservation:*${PLAYER_ID}*")

if [[ -z "$KEYS" ]]; then
  echo "No reservation keys found for player $PLAYER_ID"
  exit 0
fi

for key in $KEYS; do
  redis-cli -u "$REDIS_URL" DEL "$key" >/dev/null
  echo "Deleted $key"
done
