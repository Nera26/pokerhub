# Canary Deployment Runbook

This document explains how to roll out a canary deployment and verify it with load tests.

## Steps

1. Build and push the container image.
2. Deploy the canary using `docs/scripts/canary-deploy.sh`:
   ```bash
   IMAGE=ghcr.io/<org>/pokerhub/room-worker:<sha> \
   GITHUB_TOKEN=<token> GITHUB_ACTOR=<actor> \
   bash docs/scripts/canary-deploy.sh
   ```
3. The script runs the k6 load test and exports `summary.json`.
4. Monitor metrics and roll back if the script exits non-zero.
5. Remove the canary deployment after validation.
