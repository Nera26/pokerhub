# Backend Startup Fallback Warnings

## Summary
Your backend is starting, but it is falling back to in-memory stand-ins because the required services and telemetry collector are not reachable. The warnings you see are expected when Postgres, Redis, RabbitMQ, or other dependencies are not running. The "Telemetry trace shutdown failed" message only appears when the app stops without an OTLP collector listening on `localhost:4318`.

## How to Fix `npm run start` Locally
Follow these steps to run the backend with real services instead of the in-memory shims.

### 1. Provision Environment Variables
Copy the example environment file so the backend knows where to find Postgres, Redis, RabbitMQ, and the other integrations:

```bash
cp .env.example .env
```

Adjust connection strings as needed for your local setup.

### 2. Start the Dependent Services
Launch the required infrastructure locally. Either run the helper script:

```bash
./scripts/quickstart.sh
```

or start the containers manually:

```bash
docker compose up
```

These commands bring up Postgres, Redis, RabbitMQ, and the storage emulator so the backend can connect instead of dropping into in-memory fallbacks.

### 3. Run the Server
Install dependencies and start the backend from `/backend` in development or production mode:

```bash
cd backend
npm install
npm run start:dev   # or npm run start:prod
```

The application should now boot cleanly and connect to the services you launched above.

### Optional – Telemetry
By default the service tries to export traces to `http://localhost:4318/v1/traces`. Run an OTLP collector at that endpoint or set `OTEL_EXPORTER_OTLP_ENDPOINT` to a reachable collector to suppress the shutdown warning. The warning is harmless if you skip telemetry during local development.

## Testing
⚠️ Tests not run (QA review only).
