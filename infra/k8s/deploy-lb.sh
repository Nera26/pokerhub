#!/bin/bash
set -e
CONFIG_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KONG_CONFIG="$CONFIG_DIR/../api-gateway/kong.yml"
REGIONS=(us-east eu-west ap-south)

for region in "${REGIONS[@]}"; do
  echo "Deploying Kong config to $region"
  if command -v kubectl >/dev/null 2>&1; then
    kubectl --context "$region" create configmap kong-config --from-file=kong.yml="$KONG_CONFIG" \
      --dry-run=client -o yaml | kubectl --context "$region" apply -f - || \
      echo "Failed to apply config in $region"
  else
    echo "kubectl not installed; skipping $region"
  fi
done
