#!/usr/bin/env bash
set -euo pipefail

##
# Promote the API deployment in the given environment.
#
# Usage:
#   DEPLOY_ENV=<staging|production> ./scripts/promote.sh
#
# The script expects `kubectl` to be configured for the target cluster and
# requires the DEPLOY_ENV environment variable to be set to either `staging`
# or `production`.
##

ENV=${DEPLOY_ENV:-}
if [[ "$ENV" != "staging" && "$ENV" != "production" ]]; then
  echo "DEPLOY_ENV must be set to staging or production" >&2
  exit 1
fi

echo "Promoting deployment in $ENV..."
if ! kubectl rollout restart deployment/api -n "$ENV"; then
  echo "Failed to promote deployment in $ENV" >&2
  exit 1
fi
echo "Promotion complete for $ENV"
