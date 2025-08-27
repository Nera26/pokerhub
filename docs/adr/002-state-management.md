# ADR 002: State Management

## Status

Accepted

## Context

The application needs to manage both remote server data and local client state with minimal complexity.

## Decision

- Use **React Query** for all remote data fetching and caching.
- Use **Zustand** for lightweight client state such as authentication and table data.
- Keep global state minimal and prefer component or URL state for ephemeral UI data.

## Consequences

- Data fetching logic is declarative and deduplicated through React Query.
- Zustand stores remain small and focused, reducing unnecessary re-renders.
- Developers must understand two state tools but gain clear separation of concerns.
