# Agents Guide (PokerHub)

This repository (`pokerhub`) is the **root meta repo**. It contains two synced *subtrees*:

/frontend → https://github.com/Nera26/poker-frontend (Next.js UI)
/backend → https://github.com/Nera26/pokerhub-backend (Express.js API)
/ → docs, workflows, CI, shared contracts

markdown
Copy code

> ⚠️ All work flows through the **root** repo. Do **not** push directly to child repos; the root mirrors them (via CI or `git subtree push`).

---

## 1) Roles

- **Frontend Agent** – Owns `/frontend`. Implements UI, data fetching, state, access control *as enforced by API*.
- **Backend Agent** – Owns `/backend`. Implements routes, validation, auth, business logic, DB.
- **Integration Agent** (either role) – Ensures **API ↔ UI contract** stays in sync, runs e2e smoke tests, coordinates releases.

---

## 2) Golden Rule: API ↔ UI Contract

Any change that affects the API **must** update the frontend **in the same PR** (atomic change).  
Any new/changed UI that calls the API **must** update the backend **in the same PR**.

### What counts as a *contract change*?
- Route path added/removed/renamed
- Method changed (GET/POST/PUT/DELETE)
- Query/body params added/removed/renamed/type-changed
- Response shape or HTTP status codes changed
- Auth/permissions required changed
- Pagination/sorting/filtering semantics changed
- Error schema changed

### Mandatory artifacts in the same PR
- Updated **Zod** validator(s) in `/backend`
- Updated **TypeScript types** (or shared types) in `/frontend`
- Updated **OpenAPI** (or contract doc) under `/contracts/openapi.yaml`
- Updated **tests** (unit/integration/e2e) proving the new contract

---

## 3) Folder Structure (root)

/backend/ # API service (Express)
src/
routes/
services/
schemas/ # Zod validators (request/response)
/frontend/ # Next.js app (pages/app routes, services)
/contracts/
openapi.yaml # Single source of truth for endpoints
types/
api.d.ts # Generated TS from OpenAPI or hand-maintained
/shared/
constants.ts # shared enums, route names, versions
types.ts # shared DTO interfaces (imported by FE & BE)
/.github/
workflows/
sync-subtrees.yml # auto-mirror frontend & backend repos
agents.md # this file

yaml
Copy code

> Prefer **shared types** in `/shared/` and import them from both apps to minimize drift.

---

## 4) Workflow

### 4.1 Clone & Sync
```bash
git clone https://github.com/Nera26/pokerhub.git
cd pokerhub
npm run pull:all            # pulls latest FE & BE from child repos (subtree)
4.2 Branching
Feature branches: feat/<area>-<short-desc>

Examples: feat/api-tables-minraise, feat/ui-lobby-filters

Fix branches: fix/<area>-<short-desc>

4.3 Develop (by role)
Backend: implement route + Zod schemas under /backend/src/schemas, update /contracts/openapi.yaml, export DTOs in /shared/types.ts.

Frontend: update service layer to use shared DTOs, wire UI, keep types in sync.

4.4 Commit Message Convention
pgsql
Copy code
feat(api+ui): add /tables/{id}/min-raise and integrate lobby bet presets
fix(ui): clamp bet input by BB increment on turn
chore(contracts): regenerate api.d.ts from openapi.yaml
4.5 PR Requirements (must pass before merge)
✅ API ↔ UI contract checklist (below) checked

✅ Unit tests (be + fe) green

✅ Integration/e2e smoke tests green

✅ Lint & typecheck green

✅ Review from both FE & BE owners if contract changed

5) API ↔ UI Contract Checklist (paste this in PR description)
 OpenAPI updated (/contracts/openapi.yaml)

 Zod schemas updated for request & response (/backend/src/schemas/**)

 Shared DTOs updated (/shared/types.ts) and imported by both FE & BE

 Frontend service updated (method, URL, params, response typing)

 Error handling aligned (HTTP codes & error body shape)

 Auth/permissions documented and enforced on both sides

 Pagination/sorting/filtering semantics tested

 Tests added/updated:

 backend unit/integration

 frontend unit

 e2e happy path (at least /health + one business flow)

 Docs updated (README/feature docs/changelog)

6) Versioning & Compatibility
Contract version lives in /shared/constants.ts as API_CONTRACT_VERSION.

If a change is backward-incompatible, bump MAJOR; otherwise bump MINOR.

The frontend refuses to run against mismatched major versions and shows a friendly upgrade notice.

ts
Copy code
// /shared/constants.ts
export const API_CONTRACT_VERSION = "2.1.0"; // MAJOR.MINOR.PATCH
7) Testing Policy
Backend

Unit tests for services & schemas

Integration tests for routes (supertest)

Contract tests that validate Zod ⇄ OpenAPI alignment

Frontend

Unit tests for service calls (mock API)

Component tests for critical UI

E2E smoke (Playwright): login → join table → perform action → see result

Minimum bar to merge: all tests green, CI status checks required.

8) Subtree Commands (for integrators)
Pull latest from child repos

bash
Copy code
npm run pull:frontend   # git subtree pull --prefix frontend frontend-remote main --squash
npm run pull:backend    # git subtree pull --prefix backend  backend-remote  main --squash
npm run pull:all
Push changes back to child repos

bash
Copy code
npm run push:frontend   # git subtree push --prefix frontend frontend-remote main
npm run push:backend    # git subtree push --prefix backend  backend-remote  main
npm run push:all
CI auto-mirroring runs on every push to main. Token used: SUBTREE_PUSH_TOKEN.

9) Code Owners & Reviews
Define reviewers in .github/CODEOWNERS:

swift
Copy code
/frontend/ @Nera26 @FrontendTeam
/backend/  @Nera26 @BackendTeam
/contracts/ @Nera26 @IntegrationTeam
/shared/   @Nera26 @IntegrationTeam
Any PR that touches contract (backend routes, schemas, /contracts, /shared) requires both FE & BE approvals.

10) Breaking Change Procedure (API)
If you must introduce a breaking API change:

Add new versioned endpoint (e.g., /v2/tables/...) alongside old.

Implement FE for new endpoint; ship both for a short deprecation window.

Announce removal date in CHANGELOG.md.

Remove old endpoint after the window; bump MAJOR.

11) Quick Example (Contract-Driven)
Backend (/backend/src/schemas/tables.ts)

ts
Copy code
import { z } from "zod";

export const TableId = z.string().uuid();

export const GetMinRaiseResponse = z.object({
  tableId: TableId,
  street: z.enum(["pre","flop","turn","river"]),
  minRaiseTo: z.number().int().nonnegative(),
});

export type GetMinRaiseResponse = z.infer<typeof GetMinRaiseResponse>;
Shared DTO (/shared/types.ts)

ts
Copy code
export type { GetMinRaiseResponse } from "../backend/src/schemas/tables"; // or generate from OpenAPI
Frontend service (/frontend/src/lib/api/tables.ts)

ts
Copy code
import type { GetMinRaiseResponse } from "@shared/types";

export async function getMinRaise(tableId: string): Promise<GetMinRaiseResponse> {
  const res = await fetch(`/api/tables/${tableId}/min-raise`);
  if (!res.ok) throw new Error("Failed to fetch min-raise");
  return (await res.json()) as GetMinRaiseResponse;
}
This ensures the exact same type is used on both sides.

12) CI Rules (root)
sync-subtrees.yml: mirrors /frontend and /backend to their repos on push to main.

All new workflows must include proof-archive verification (`check-proof-archive` or `proof-archive`).

Required checks:

frontend: typecheck + unit + e2e smoke

backend: typecheck + unit + integration

contracts: validate openapi.yaml + schema drift

13) Ground Rules (TL;DR)
Never merge API changes without frontend changes in the same PR.

Keep /contracts/openapi.yaml and /shared/types.ts as the source of truth.

Always npm run pull:all before a new branch.

Don’t bypass reviews; code owner approvals are required for their areas.

Keep commit messages clear and scoped (use feat(api+ui): ... when it touches both).