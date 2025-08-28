#!/usr/bin/env bash
set -euo pipefail

# Wrapper around toxiproxy.sh for soak test defaults.
# Injects 5% packet loss and 200ms jitter between clients and the server.
PACKET_LOSS=0.05 JITTER_MS=200 "$(dirname "$0")/toxiproxy.sh" "$@"
