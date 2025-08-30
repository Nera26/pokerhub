#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

# Deploy canary
"$SCRIPT_DIR/canary-deploy.sh"

# Check health and rollback on failure
if "$SCRIPT_DIR/check-canary.sh"; then
  echo "Canary deployment healthy"
else
  echo "Canary health check failed; initiating rollback..." >&2
  "$SCRIPT_DIR/canary-rollback.sh"
  exit 1
fi
