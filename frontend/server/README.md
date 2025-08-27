# Server Setup

This directory holds backend code for the PokerHub application.

## Directory Structure

- `routes/` – Express route definitions
- `controllers/` – Request handlers
- `services/` – Business logic
- `models/` – Database schema and ORM configuration

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
