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

2. Start all services:

   ```bash
   docker-compose up
   ```

   Override values in `.env` or extend `docker-compose.override.yml` for local tweaks.

The compose configuration uses health checks so the backend only starts once PostgreSQL, Redis, RabbitMQ, and LocalStack are
ready. TypeORM runs with `synchronize: true`, applying pending migrations during container bootstrap.
