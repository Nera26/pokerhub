# PokerHub Backend

The PokerHub API is a [NestJS](https://nestjs.com/) service that exposes REST and WebSocket endpoints for the poker platform. It is one half of the meta‑repo alongside the Next.js frontend and shared contracts.

## Prerequisites

- Node.js 20+
- [PostgreSQL](https://www.postgresql.org/) database
- [Redis](https://redis.io/) instance

Copy the root `.env.example` to `.env` and update values. Core variables:

```bash
DATABASE_URL=postgres://user:pass@host:5432/pokerhub
REDIS_URL=redis://host:6379
JWT_SECRET=dev-secret
GATEWAY_GLOBAL_LIMIT=30 # max actions per 10s across all sockets
SYSTEM_ACCOUNTS=reserve,house,rake,prize # special account names excluded from notifications
```
Additional options exist for storage, telemetry and message queues (see `.env.example`).

To reduce churn during table balancing, set `TOURNAMENT_AVOID_WITHIN` to the
number of hands a player must wait before being moved again. This maps to the
`tournament.avoidWithin` configuration key (default: `10` hands).

## Install & Run

```bash
cd backend
npm install

# start in watch mode
npm run start:dev

# production build
npm run start:prod
```

## Test Credentials

Local development and load tests occasionally require a throwaway user. Rather than running an ad‑hoc seeding script, provide the credentials through environment variables so they can be injected per environment:

```bash
TEST_USER_EMAIL=user@example.com
TEST_USER_PASSWORD=secret
```

On startup the service can check for these values and create the user if it does not exist. This keeps secrets out of version control and allows CI to provision test accounts securely.

## Tests

```bash
npm test
```

## Game State Recovery

The WebSocket gateway periodically persists table snapshots to Postgres in the
`game_state` table. On startup, the latest snapshot is loaded before applying
pending diffs from Redis, allowing games to resume after a crash or Redis loss.

Run migrations to create the table:

```bash
npm run migration:run
```

## Shared Contracts & Frontend Integration

This repository contains shared API contracts under `../contracts` and TypeScript DTOs in `../shared`. The backend imports these types (e.g. `@shared/types`) and must keep them in sync with the OpenAPI spec. The frontend in `../frontend` consumes the same shared types to call this API. Any endpoint change should update the shared contracts and corresponding frontend code in the same pull request.

