# PokerHub (root)

## Core Documentation

- [Game Engine Specification](docs/game-engine-spec.md)
- [Tournament Handbook](docs/tournament-handbook.md)
- [Accounting Book](docs/accounting-book.md)
- [Milestone Roadmap](docs/roadmap.md)
- [Reconciliation Guide](docs/reconciliation-guide.md)
- [Documentation Index](docs/index.md)

## Development Environment

The project provides a Docker setup for the full stack:

- **PostgreSQL** for persistence
- **Redis** for caching
- **RabbitMQ** for messaging
 - **Cloud Storage emulator** for local file uploads
- **backend** service (NestJS API)

### Quick Start

1. Copy the example environment file and adjust values as needed:

   ```bash
   cp .env.example .env
   ```

   The `.env` file uses URL-style connection strings:

   ```
    DATABASE_URL=postgres://postgres:postgres@db:5432/pokerhub
    REDIS_URL=redis://redis:6379
    RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
    ```

    Additional environment variables configure Google Cloud Storage:

    ```
    GCP_PROJECT=pokerhub-dev
    GCS_BUCKET=pokerhub-dev
    GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json
    # Optional emulator for Cloud Storage
    GCS_EMULATOR_HOST=http://storage:4443
    ```

    Adjust the URLs as needed for your local environment.

2. Start all services:

   ```bash
   docker-compose up
   ```

   Override values in `.env` or extend `docker-compose.override.yml` for local tweaks.

  The compose configuration uses health checks so the backend only starts once PostgreSQL, Redis, RabbitMQ, and the Cloud Storage emulator are
  ready. TypeORM's `synchronize` option is controlled by the `DB_SYNC` flag (defaults to `true` in this compose setup).

### Subtree Sync Scripts

Use the provided npm scripts to synchronize the frontend and backend subtrees with their upstream repositories.

```bash
npm run pull:frontend   # git subtree pull --prefix frontend frontend-remote main --squash
npm run pull:backend    # git subtree pull --prefix backend backend-remote main --squash
npm run pull:all        # pull both subtrees

npm run push:frontend   # git subtree push --prefix frontend frontend-remote main
npm run push:backend    # git subtree push --prefix backend backend-remote main
npm run push:all        # push both subtrees
```

## Testing

Run all backend, frontend, contract, and end-to-end tests with:

```bash
npm test
```

This single command executes the backend and frontend unit tests, contract tests, and frontend E2E suite.

## Documentation

- [Game Engine Overview](docs/game-engine.md) – state transitions, message schemas, and timers.
- [RNG Fairness Whitepaper](docs/rng-fairness.md) – seed generation and commit–reveal verification.
- [Runbooks](docs/runbooks/) – operational playbooks for stuck hands, orphaned reservations, and more.
- [Accounting Book](docs/accounting-book.md) – ledger schema and reconciliation jobs.
- [Wallet Reconciliation Guide](docs/player/wallet-reconciliation.md) – verify wallet balances against the ledger.
- [RNG Commit–Reveal Whitepaper](docs/player/rng-whitepaper.md) – public audit proofs and seed retention policies.

