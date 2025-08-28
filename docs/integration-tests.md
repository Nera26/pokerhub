# Integration Test Flow

These end-to-end tests exercise the full stack using real services.

## Running locally

```bash
# start backend and frontend containers
docker compose -f docker-compose.yml -f docker-compose.test.yml up -d

# run the Playwright suite
cd frontend
npm run test:e2e:integration
```

The tests will:

1. Log in through the UI.
2. Join a poker table and play a hand.
3. Observe `hand.start` and `hand.end` events over WebSocket.
4. Fetch `/hands/{id}/proof` and verify the RNG commit–reveal hash.

If the API schema changes, Zod parsing fails and the tests fail,
ensuring contract mismatches are caught. Proofs from each run are
written to `frontend/test-results/` for audit.

## Shutdown

```bash
docker compose -f docker-compose.yml -f docker-compose.test.yml down -v
```
