# PokerHub

PokerHub is a web client for playing and managing online poker games. It features an interactive poker table, tournament tools, and an admin dashboard for managing users and balances. Built with modern web technologies, PokerHub provides a responsive and real-time experience.

## Features

- Interactive poker table with seat highlighting and customizable rim styles
- Admin dashboard with user management, balance tracking, audit logs, table and tournament management, bonus tools, broadcasts, messages, and analytics
- Login flow with token-based sessions
- Real-time capabilities via Socket.IO
- Global state handled with Zustand
- Responsive UI built with Tailwind CSS
- Offline support via service worker caching

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org) 15 with the App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Realtime**: socket.io-client
- **Testing**: Jest & Testing Library
- **Tooling**: ESLint, Prettier, Husky

## Architecture & State Management

An overview of the client architecture, high-level flow, and project layout is available in [docs/architecture.md](./docs/architecture.md).

- **Zustand** powers client-side state through stores in `src/app/store`.
- **React Query** handles server state with `use<Resource>`-style hooks under `src/hooks`.

## Frontend Architecture

A deeper dive into folder layout, state management, testing, and dynamic imports lives in [docs/frontend-architecture.md](./docs/frontend-architecture.md).

## Directory Structure

```text
src/
  app/                # Next.js routes and features
  hooks/              # Shared hooks (React Query helpers)
  lib/                # Utilities and services
  stories/            # Storybook stories
  types/              # Global TypeScript types
```

## Setup

### Requirements

- Node.js 18+

### Install dependencies

```bash
npm install
```

### Environment variables

Copy `.env.example` to `.env` and update the values as needed:

```bash
cp .env.example .env
```

Define the following variables (required unless noted):

<!-- prettier-ignore -->
| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_BASE_URL` | Base URL for API requests. Required when `NODE_ENV` is not `development` (e.g. `http://localhost:3000`). |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.IO server address for realtime updates. Required when `NODE_ENV` is not `development` (e.g. `http://localhost:4000`). |
| `NEXT_PUBLIC_LOG_LEVEL` | Optional client log level (`error`, `warn`, `info`, `debug`; default `info`). |
| `NEXT_PUBLIC_CSP` | Semicolon-separated CSP directives; `script-src` and `style-src` get a runtime `nonce`. |
| `VERCEL_URL` | Provided automatically in production deployments. |

When establishing realtime connections with `getSocket` (from `src/lib/socket-core.ts`), remember to call `disconnectSocket()` in `useEffect` cleanups or similar teardown logic to avoid leaving stale connections open.

### Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Run tests and type checking

```bash
npm test
npm run typecheck
```

### Run end-to-end tests

```bash
npm run build
npm run test:e2e
```

### Run accessibility tests

```bash
npm run test:a11y
```

### Run Storybook

Stories for reusable UI components reside under `src/app/components/ui`. These stories describe props, variant options and relevant accessibility notes. Launch an interactive catalog with:

```bash
npm run storybook
```

### Analyze bundle size

Visualize the client bundle to spot oversized dependencies:

```bash
npm run analyze
```

This builds the app with `@next/bundle-analyzer` and opens an interactive report.

### Scripts

| Script            | Description                          |
| ----------------- | ------------------------------------ |
| `dev`             | Start the development server.        |
| `build`           | Create a production build.           |
| `start`           | Run the production server.           |
| `lint`            | Execute ESLint and Prettier checks.  |
| `typecheck`       | Run TypeScript type checking.        |
| `test`            | Run unit tests with Jest.            |
| `test:e2e`        | Execute Playwright end-to-end tests. |
| `test:a11y`       | Run accessibility tests.             |
| `format`          | Format source files with Prettier.   |
| `test:perf`       | Audit performance using Lighthouse.  |
| `lighthouse:ci`   | Run Lighthouse in CI mode.           |
| `storybook`       | Launch the Storybook UI.             |
| `build-storybook` | Build the static Storybook site.     |
| `analyze`         | Generate bundle size report.         |

## Contributor Onboarding

After setting up the project, run these commands to get acquainted:

```bash
npm run lint       # ESLint static analysis
npm test           # Jest unit tests
npm run storybook  # Component catalog
```

These checks ensure code style, test coverage, and UI components remain healthy before you start developing features.

## Offline support

PokerHub ships with a custom service worker that pre-caches core routes (`/`, `/login`, `/dashboard`) and static assets like the web app manifest and logo. After the initial visit these resources are served from cache, allowing the app shell to load even when the network is unavailable.

### Manual verification

1. Run `npm run dev` and open the app in the browser.
2. Confirm a service worker is registered in the **Application → Service Workers** tab of devtools.
3. Toggle **Offline** and reload the page; the home screen should render from cache without a network connection.

### Error Handling

The main site route (`src/app/(site)`) uses a route-level error boundary (`error.tsx`) to surface failed data requests.
When an asynchronous fetch in `page.tsx` throws, the boundary displays the error message and offers a **Retry** button that refreshes the page.

## Front-end Performance Tips

- **Code-splitting**: Split bundles with Next.js dynamic imports or route-based chunks to reduce the initial load time.
- **Memoization**: Use `React.memo`, `useMemo`, and `useCallback` to avoid re-rendering components when inputs are unchanged.
- **Virtualization & Lazy Loading**: For sizable lists like chat messages, render only the visible rows with libraries such as `react-window` and fetch more items on demand.

## Contributing

1. Fork the repository and create a feature branch.
2. Follow the coding conventions below.
3. Run `npm run format`, `npm run lint`, `npm test`, `npm run typecheck`, and optionally `npm run storybook` before committing.
4. Submit a pull request with a clear description.

### Coding conventions

- TypeScript for all code
- Prettier formatting via `npm run format`
- ESLint checks via `npm run lint`
- Functional React components and hooks
- Tailwind CSS utility classes for styling
- Include or update tests with your changes
