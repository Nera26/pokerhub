# Server Setup

This directory holds backend code for the PokerHub application.

## Directory Structure

- `routes/` – Express route definitions
- `controllers/` – Request handlers
- `services/` – Business logic
- `models/` – Database schema and ORM configuration

## Server Startup

The server can be embedded into the Next.js app by mounting the routes on an
Express instance. An example `server/index.ts` looks like:

```ts
import express from 'express';
import next from 'next';
import routes from './routes';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  server.use('/api', routes);

  server.all('*', (req, res) => handle(req, res));

  const port = process.env.PORT ?? 3000;
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
```

## Database & Migrations

Prisma is used for database access and migrations.

1. Install dependencies:
   ```bash
   npm install prisma @prisma/client
   ```
2. Generate the Prisma client:
   ```bash
   npx prisma generate
   ```
3. Create and apply migrations:
   ```bash
   npx prisma migrate dev --name init
   ```

Set the `DATABASE_URL` environment variable to point to your database.
