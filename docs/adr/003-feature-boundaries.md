# ADR 003: Feature Boundaries

## Status

Accepted

## Context

As the app grows, organizing code by technical layer leads to coupling and hinders discoverability.

## Decision

- Adopt a feature-sliced structure where each feature owns its UI, logic, and tests under `src/features/<feature>`.
- Route files under `src/app` delegate to these feature modules via dynamic import.
- Shared primitives live in `src/app/components/ui` and `src/lib`.

## Consequences

- Features are isolated and can evolve independently.
- Routing code stays thin while features encapsulate complexity.
- Some duplication may occur across features, requiring documentation and periodic refactoring.
