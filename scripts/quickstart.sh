#!/usr/bin/env bash
set -euo pipefail

error() {
  echo "Error: $1" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || error "$1 is required but not installed."
}

# Move to repository root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR/.."
cd "$ROOT_DIR"

require_cmd docker-compose
require_cmd npm

if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "Created .env from .env.example"
  else
    error ".env.example not found"
  fi
else
  echo ".env already exists; skipping copy"
fi

echo "Starting Docker services..."
docker-compose up -d || error "docker-compose up failed"

echo "Running tests..."
npm test || error "npm test failed"

echo "Quickstart completed successfully."
