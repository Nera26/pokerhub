#!/usr/bin/env bash
set -euo pipefail

TMP_FILE=$(mktemp)
trap "rm -f \"$TMP_FILE\"" EXIT

# Generate Zod schemas from OpenAPI and compare with shared types
npx -y openapi-zod-client contracts/openapi.yaml -o "$TMP_FILE" --export-schemas >/dev/null

if ! diff -q "$TMP_FILE" shared/types.ts >/dev/null; then
  echo "shared/types.ts is out of sync with contracts/openapi.yaml" >&2
  diff "$TMP_FILE" shared/types.ts || true
  exit 1
fi

echo "API contract types are in sync"
