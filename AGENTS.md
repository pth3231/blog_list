# AGENTS.md

Two independent packages live side by side; there is **no root orchestration**
and **no root `package.json`**. Run all commands from inside the relevant subdir.

- `backend/` — Express 5 + TypeScript (CommonJS) REST API, MongoDB via Mongoose.
- `frontend/` — React 19 + Vite + Tailwind v4 + Zustand + React Router 7 (React Compiler enabled).

`CLAUDE.md` is the canonical, detailed guide (architecture, conventions, commands).
`CONVENTION.md` holds the prose style rationale. This file is the short orientation.

## Commands

Backend (run in `backend/`):
- `npm run dev` — tsx watch on `server.ts` (NODE_ENV=development).
- `npm test` — `vitest run` with NODE_ENV=test. **Requires a live MongoDB** (see below).
- `npm run build` — `tsc` + `tsc-alias`, emits to `dist/`.
- `npm run lint` / `npm run lint:fix`.
- `npm start` — runs the compiled build. In production the API also serves the
  built `frontend/dist` SPA on the same origin.
- **Production:** `docker compose -f compose.prod.yaml up -d --build` (multi-stage
  `Dockerfile`, `restart: unless-stopped`, `/health/ready` healthcheck, `init: true`).
  Copy `.env.prod.example` → `.env.prod` first. See `README.md`.

Frontend (run in `frontend/`):
- `npm run dev` (vite), `npm run build` (`tsc -b && vite build`), `npm run lint`, `npm run preview`.

## Backend test / run prerequisites

- Integration tests connect to a **real MongoDB**; there is no mock. Each suite
  writes to a unique DB via `uniqueDbUri()` (`backend/tests/integration/testDb.ts`).
- Start the test DB with `docker compose -f backend/compose.yaml up -d`
  (container `blog-list-mongo-test`, port 27017). GitHub Actions starts one
  automatically (`.github/workflows/ci.yml`).
- Dev/start need a `.env` (gitignored) copied from `backend/.env.example`
  (`PORT`, `MONGODB_URI`, `JWT_SECRET`, …). For local dev set **`PORT=3000`** —
  the Vite proxy targets `:3000`. A missing `.env` in CI/containers is fine;
  `utils/config.ts` reads from the real environment in that case.
- Tests need no `.env`: `vitest.config.ts` hardcodes `JWT_SECRET`.

## Architecture notes that bite if ignored

- The `@/` path alias is standardized in **both** packages and **enforced**:
  backend `@/` → backend root (`tsconfig.json` `paths` + `vitest.config.ts`,
  rewritten by `tsc-alias`); frontend `@/` → `src/` (`tsconfig.app.json` `paths`
  + `vite.config.ts` `resolve.alias`). The ESLint rule `alias/no-cross-dir-relative`
  (inline in both ESLint configs, no extra dep) forbids `../…` imports — use `@/…`
  for anything outside the current directory. Same-dir `./sibling` is allowed.
- `backend/tsconfig.json` is stricter than TS defaults
  (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
  `noPropertyAccessFromIndexSignature`). Patterns that compile elsewhere fail here.
- **Auth is cookie-based, not bearer tokens.** Login/register set an `httpOnly`
  cookie (`utils/auth.ts`); `authenticateToken` reads it. The token is never
  exposed to JS or returned in a response body. Frontend `fetch` uses
  `credentials: 'include'`.
- Layered flow is fixed by convention: `models/`, `controllers/`, `routes/`,
  `middlewares/`, `utils/`, `types/`, `tests/`. Route → controller → model.
  Controllers return `ServiceResult<T>`; routes translate it via `sendResult`.
- `GET /posts` is **paginated** (`limit`/`skip`, capped) and returns view objects
  (`likes` + `likedByMe`), never the internal `likedBy` user-id list.
- `DELETE /posts/:id` checks ownership (403 for non-owners).

## Style / lint guardrails (enforced, not optional)

ESLint and `CONVENTION.md` enforce these — full rules are in `CONVENTION.md` and
the two ESLint configs. Highlights: no semicolons, single quotes, 4-space indent,
no trailing commas; backend `snake_case` filenames, frontend idiomatic React
naming; interfaces prefixed `I…`; `null` (never explicit `undefined`) for absent
values; no `any`; guard clauses over `if/else` pyramids; explicit return types.

Formatting is enforced with ESLint's core rules (no Prettier) — this is
intentional; do not introduce a formatter without team sign-off.
**Non-deprecated usage is enforced** by `@typescript-eslint/no-deprecated`
(error) in both ESLint configs — never use a `@deprecated` API/option; migrate
to the replacement.
