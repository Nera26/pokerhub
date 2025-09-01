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
```
Additional options exist for storage, telemetry and message queues (see `.env.example`).

## Install & Run

```bash
cd backend
npm install

# start in watch mode
npm run start:dev

# production build
npm run start:prod
```

## Tests

```bash
npm test
```

## Shared Contracts & Frontend Integration

This repository contains shared API contracts under `../contracts` and TypeScript DTOs in `../shared`. The backend imports these types (e.g. `@shared/types`) and must keep them in sync with the OpenAPI spec. The frontend in `../frontend` consumes the same shared types to call this API. Any endpoint change should update the shared contracts and corresponding frontend code in the same pull request.

