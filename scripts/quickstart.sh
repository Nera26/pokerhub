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

require_cmd docker
require_cmd npm

if ! docker compose version >/dev/null 2>&1; then
  cat <<'EOF' >&2
Error: docker compose plugin is required but not installed.

To replace the legacy docker-compose v1 binary and install Compose v2:
  sudo apt remove docker-compose || pip uninstall docker-compose
  sudo apt-get update
  sudo apt-get install docker-compose-plugin

After installing the plugin, rerun this script (Compose v2 uses `docker compose ...`).
EOF
  exit 1
fi

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
docker compose up -d || error "docker compose up failed"

echo "Running tests..."
npm test || error "npm test failed"

echo "Quickstart completed successfully."
