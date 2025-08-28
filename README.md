# PokerHub (root)

## Development Environment

The project provides a Docker setup for the full stack:

- **PostgreSQL** for persistence
- **Redis** for caching
- **RabbitMQ** for messaging
- **LocalStack** to emulate AWS services
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

   Adjust the URLs as needed for your local environment.

2. Start all services:

   ```bash
   docker-compose up
   ```

   Override values in `.env` or extend `docker-compose.override.yml` for local tweaks.

The compose configuration uses health checks so the backend only starts once PostgreSQL, Redis, RabbitMQ, and LocalStack are
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

