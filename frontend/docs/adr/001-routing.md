# ADR 001: Routing Strategy

## Status

Accepted

## Context

PokerHub uses the Next.js App Router to structure pages and nested layouts. We need predictable route boundaries, lazy loading, and error isolation.

## Decision

- Organize route files under `src/app` with feature modules under `src/features`.
- Use `next/dynamic` to lazy load page modules so code is only fetched when a route is visited.
- Provide an `error.tsx` file for each route to act as an error boundary.

## Consequences

- Page bundles remain small and are loaded on demand.
- Errors are contained to the failing route, preventing a full app crash.
- Additional boilerplate is required for dynamic imports and error boundaries.
