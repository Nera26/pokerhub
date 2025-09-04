# Frontend Architecture

This document outlines key conventions for organizing and testing the PokerHub client.

## Folder Layout

- `src/app` – Next.js App Router, feature routes, and co-located UI components.
- `src/hooks` – Shared hooks such as React Query data utilities.
- `src/lib` – Framework-agnostic helpers, API clients, and other utilities.

## State Management

Server and client state are handled separately:

- **React Query** manages remote data with `use<Resource>` hooks under `src/hooks`. Queries are cached and invalidated on mutations.
- **Zustand** stores in `src/app/store` hold client state like auth and table data.

### Global State

- Expose minimal slices via selector hooks (e.g., `useAuthToken`, `useSeatPositions`) rather than subscribing to entire stores. This limits re-renders and clarifies intent.
- Prefer component or URL state for ephemeral UI data. After review, global state is reserved for shared concerns such as auth tokens and table seat positions used by chip animations.

## Testing Strategy

- **Unit tests** live in `src/__tests__` and use Jest with React Testing Library.
- **End-to-end tests** in `e2e/` run with Playwright against a built app.
- **Accessibility checks** leverage `axe` via the `npm run test:a11y` script.

## Dynamic Imports

The project uses Next.js `next/dynamic` for on-demand code splitting. Heavy or client-only components are loaded lazily to keep the initial bundle light and improve performance.

## SSR and ISR

- Pages that require fresh data run as **Server Components**, leveraging Next.js SSR to prefetch queries on the server.
- Static marketing pages can opt into **Incremental Static Regeneration (ISR)** to regenerate on a schedule without a full rebuild.

## Error Boundaries

- A global error boundary lives in `src/app/error.tsx` to catch unhandled failures.
- Site pages share a group-level `error.tsx` under `src/app/(site)` that reuses a shared `RouteError` component for localized recovery while preserving the common layout. All other routes fall back to the global error component.
