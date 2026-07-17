# AGENTS.md

Two independent packages live side by side; there is **no root orchestration**. Run all commands from inside the relevant subdir. The root `package.json` only carries the `shadcn` CLI devDep.

- `backend/` — Express + TypeScript (CommonJS) REST API, MongoDB via Mongoose.
- `frontend/` — React 19 + Vite + Tailwind v4 + Zustand + React Router 7, React Compiler enabled.

## Commands

Backend (run in `backend/`):
- `npm run dev` — tsx watch on `server.ts` (NODE_ENV=development).
- `npm test` — `vitest run` with NODE_ENV=test. **Requires a live MongoDB** (see below).
- `npm run build` — `tsc` + `tsc-alias`, emits to `../build/backend`.
- `npm run lint` / `npm run lint:fix`.
- `npm start` — runs the compiled build (NODE_ENV=production, `NODE_PATH=./node_modules node ../build/backend/server.js`).

Frontend (run in `frontend/`):
- `npm run dev` (vite), `npm run build` (`tsc -b && vite build`), `npm run lint`, `npm run preview`.

## Backend test / run prerequisites

- Integration tests (`backend/tests/integration/*`) connect to a **real MongoDB**; there is no mock. They need `TEST_MONGODB_URI`, else fall back to `mongodb://localhost:27017/blog_list_test`. Each suite writes to a unique DB via `uniqueDbUri()` (`backend/tests/integration/testDb.ts`).
- Start the test DB with `docker compose -f backend/compose.yaml up -d` (container `blog-list-mongo-test`, port 27017).
- Dev/start need a `.env` (gitignored) with `PORT`, `MONGODB_URI`, `JWT_SECRET`. Copy from `backend/.env.example`. `NODE_ENV=test` switches config to `TEST_MONGODB_URI` (`backend/utils/config.ts`).
- `vitest.config.ts` hardcodes `JWT_SECRET` for tests, so tests do not need `.env`.

## Architecture quirks

- Backend uses the `@/` path alias → backend root (set in `backend/tsconfig.json` `paths` and `vitest.config.ts` `alias`). `tsc-alias` rewrites these in the build output, so keep the alias — do not "simplify" to relative imports expecting the build to resolve them.
- `backend/tsconfig.json` is stricter than TS defaults: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`. Undefined-vs-null and index-access patterns that compile elsewhere will fail here.
- Layer layout is fixed by convention: `models/`, `controllers/`, `routes/`, `middlewares/`, `utils/`, `types/`, `tests/`. Route → controller → model flow.
- `opencode.json` configures a `shadcn` MCP server (`npx shadcn@latest mcp`) and `OpenWebSearch`; use the shadcn skill/MCP for component work rather than hand-writing UI primitives.

## Style / lint guardrails (enforced, not optional)

ESLint and `CONVENTION.md` enforce these; full rules are in `CONVENTION.md`:
- **No semicolons**, single quotes, 4-space indent, no trailing/dangling commas or blank lines (enforced in both `backend/eslint.config.mjs` and `frontend/eslint.config.js`).
- Backend uses `snake_case` filenames (e.g. `post.model.ts`). The **frontend** uses idiomatic React naming: `PascalCase` for component files (`PostCard.tsx`), `camelCase` for stores/hooks/lib (`authStore.ts`, `api.ts`). See `CONVENTION.md`.
- Interfaces prefixed `I...` (e.g. `IConfig`); PascalCase classes/types; camelCase functions (verb-led).
- `null`, never an explicit `undefined` value, for absent values; optional `?` params are the one accepted `undefined`. Avoid deep optional-chaining on possibly-null.
- No `any` (use `unknown` + narrow); prefer `const`; guard clauses over `if/else` pyramids; explicit return types on exported fns/store actions.
- `no-explicit-any`, `no-non-null-assertion`, and `max-params` (4) are errors/warnings.

When in doubt about style, trust `CONVENTION.md` and the ESLint configs (`backend/eslint.config.mjs`, `frontend/eslint.config.js`).

## Multi-Agent Routing Rules
- Always invoke the `@explore` agent first to map file trees before modifying any layout files.
- Route all open-web documentation lookups and third-party API searches through the `@scout` agent.
- If a task involves changes across more than 3 source code modules, dispatch the `@general` worker agent to orchestrate the refactor sub-tasks.
