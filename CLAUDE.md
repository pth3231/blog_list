# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Layout & orchestration

Two independent packages with **no root orchestration** — there is **no root `package.json`**. Every command must run from inside `backend/` or `frontend/`. There is no monorepo tooling, no workspace install — `npm install` each package separately.

`README.md` has the full feature/API overview and `CONVENTION.md` has the complete style rules; this file captures the non-obvious architecture and the load-bearing conventions.

## Commands

Backend (run in `backend/`):

```bash
npm run dev          # tsx watch server.ts (NODE_ENV=development), morgan('dev') logging
npm test             # cross-env NODE_ENV=test vitest run  — needs a live MongoDB (see below)
npm run build        # tsc -p tsconfig.build.json && tsc-alias → dist/
npm start            # NODE_ENV=production node dist/server.js (also serves frontend/dist)
npm run lint         # eslint .
npm run lint:fix
```

Run a single backend test (from `backend/`):

```bash
npx vitest run tests/integration/like.test.ts          # one file
npx vitest run -t "should like a post and return"      # one test by name
```

Frontend (run in `frontend/`):

```bash
npm run dev          # vite (proxies /v1 → http://localhost:3000)
npm run build        # tsc -b && vite build
npm run lint
npm run preview
```

### Backend test/run prerequisites

- Tests and `npm start` need a `.env` (gitignored) copied from `backend/.env.example` with `PORT`, `MONGODB_URI`, `JWT_SECRET`. **For local dev, set `PORT=3000`** — the Vite dev proxy (`frontend/vite.config.ts`) targets `http://localhost:3000`, so any other port breaks the dev workflow.
- Integration tests hit a **real MongoDB**, no mocks. Start it once: `docker compose -f backend/compose.yaml up -d` (container `blog-list-mongo-test` on `:27017`).
- `NODE_ENV=test` makes `utils/config.ts` read `TEST_MONGODB_URI` (falls back to `mongodb://localhost:27017/blog_list_test`). `vitest.config.ts` hardcodes `JWT_SECRET`, so tests do **not** need a `.env`. Each suite isolates itself by calling `uniqueDbUri('<name>')` (`tests/integration/testDb.ts`) to get a unique DB.

## Backend architecture

Layered Express 5 API (CommonJS). The defining pattern is a **typed success/failure envelope** that flows one direction:

```
route  →  controller  →  model (Mongoose)
  ↑           │
  └── ServiceResult<T>   (controllers never throw across the boundary)
```

- **Controllers** (`controllers/*.controller.ts`) are the business logic / data-access layer. Every function returns `ServiceResult<T>` — either `{ ok: true, value }` or `{ ok: false, status, message }` — built with the constructors in `utils/service_result.ts` (`success`, `fail`, `notFound`, `forbidden`, `badRequest`). `fail` logs the error and wraps it; controllers catch and return, they do not throw to Express. Post controllers map Mongoose docs to **view objects** (`IPostView` — `likes` derived from `likedBy.length`, plus `likedByMe`); the internal `likedBy` user-id list is never serialized to clients. `deletePostById` checks ownership (403 for non-owners) and cascades comment deletion.
- **Routes** (`routes/*.route.ts`) are the HTTP boundary only: parse/validate input (incl. `parseObjectIdParam`), apply `authenticateToken`, call a controller, and translate the `ServiceResult` into a response with `sendResult(res, result, successStatus)` (`utils/http_response.ts`). When a route needs a non-default success status or a non-`{value}` body shape (e.g. `{ count }`), it inspects `result.ok` itself — see `GET /posts/count` for the manual variant.
- **Models** (`models/*.model.ts`) are Mongoose schemas: `user`, `post`, `comment`.
- **`middlewares/auth.middleware.ts`** — `authenticateToken` reads the JWT from the **httpOnly auth cookie** (`utils/auth.ts`), verifies it (`sub`, `username`), and attaches it to `req.user` via the `IAuthedRequest` extension. Protected routes mount it per-handler, not globally. `optionalAuth` resolves `req.user` when a cookie is present but lets anonymous requests through (used by public list/detail routes to compute `likedByMe`). Auth is **cookie-based, not bearer tokens** — login/register set the cookie via `setAuthCookie`; the token is never returned in a response body.
- **`utils/`** — `config.ts` (env reading, `NODE_ENV`-aware, `.env` optional), `database.ts`, `logger.ts`, `auth.ts` (JWT sign/verify + cookie helpers), `validate.ts` (dependency-free request-body parsers), plus the `ServiceResult` + HTTP helpers. **`types/`** — shared interfaces, all prefixed `I…`.

Two things that look optional but are load-bearing:

- **The `@/` path alias is standardized across both packages and enforced by ESLint.** Backend `@/` → backend root (`tsconfig.json` `paths`, mirrored in `vitest.config.ts`; `tsc-alias` rewrites it in the build output). Frontend `@/` → `src/` (`tsconfig.app.json` `paths` + `vite.config.ts` `resolve.alias`). The custom ESLint rule `alias/no-cross-dir-relative` (in both `eslint.config.mjs` / `eslint.config.js`, no extra dependency) **forbids `../…` imports** — anything that leaves the current directory must use `@/…`. Same-directory `./sibling` imports are allowed (and preferred for adjacent files). Do **not** "simplify" `@/…` imports to relative paths — the build (backend) or lint (frontend) will break.
- **`backend/tsconfig.json` is stricter than TS defaults**: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`. Patterns that compile elsewhere (bracket-vs-dot index access, optional property assignment, `arr[i]` without a null check) will fail here. This is why `process.env['PORT']` is used with bracket access.

### Production single-origin serving

In `NODE_ENV=production`, `app.ts` statically serves `frontend/dist` and falls through to its `index.html` for non-API GETs, so the whole app runs on one origin. That is why the frontend's API base is the relative `/v1` (`lib/api.ts`) — it relies on same-origin in prod and on the Vite proxy in dev.

## Frontend architecture

React 19 SPA (ESM, Vite, **React Compiler enabled** via `babel-plugin-react-compiler` in `vite.config.ts`, Tailwind v4).

- **`lib/api.ts`** — the only HTTP layer. A single `request<T>` `fetch` core over the relative `/v1` base; sends `credentials: 'include'` (auth rides the httpOnly cookie — no token in JS), sets `Content-Type`, and aborts after a 15s `AbortController` timeout. Resolves `null` for 204, throws on non-2xx with the server's `error` message. Prefer adding endpoints here rather than calling `fetch` directly from components.
- **`store/*.ts`** — Zustand stores. `postsStore` is **normalized** (`byId` + `allIds`) and **paginated** (`fetchPosts` + `fetchMore` "Load more", server-capped page size); `commentsStore` is keyed per-post (`byPostId`); `authStore` is cookie-based (no token stored — only a cached `user`). Mutations are **optimistic with rollback** — `postsStore.toggleLike` applies the change immediately, then reconciles or reverts based on the API result. Every store action has an explicit return type.
- **`pages/`** — one component per route; **`components/`** — presentational, PascalCase. Routing via React Router 7 (`App.tsx`); `ProtectedRoute` gates authed routes.

## Conventions (enforced by ESLint + `CONVENTION.md`)

The sources of truth are `CONVENTION.md` (prose rationale) and the linters `backend/eslint.config.mjs` / `frontend/eslint.config.js`. Everything below is **enforced, not stylistic preference** — violations fail the build. This section is the complete rule-by-rule mirror; where the two configs differ, the frontend variant is noted.

### Formatting (ESLint errors)
- `semi: never` — **no semicolons**.
- `quotes: single` — **single quotes**; template literals and escaped quotes are allowed. CONVENTION.md also reserves double quotes for logging/display strings — note ESLint's single-quote rule takes precedence wherever both apply.
- `indent: 4` (+1 for `SwitchCase` and `VariableDeclarator`) — **4-space indentation**.
- `comma-dangle: never` — **no trailing/dangling commas**.
- `object-curly-spacing: always` — spaces inside braces: `{ foo }`.
- `space-in-parens: never` — no spaces inside parens: `foo(x)`.
- `no-multiple-empty-lines` — **max 1** consecutive blank line, **none** at file top or bottom.
- `no-trailing-spaces`, `no-multi-spaces` — strip stray spaces.
- `prefer-const` — **`const` by default**; `let` only when reassignment is required, and its scope kept tight.

### Types & nullability
- **`null`, never an explicit `undefined`**, for absent values. Functions that may have no result return `null`.
- The **only** accepted `undefined` is the `?` optional-parameter marker (`getPosts(owner?: string)`). Never write an explicit `undefined` value, a `: undefined` branch, or cast to `undefined`.
- **Narrow nullable values with a guard before use**; prefer an early-return guard over deep `?.` chains when absence is an error or needs a fallback.
- **Distinguish "absent" (`null`) from "empty" (`''`, `[]`, `{}`)** — never use an empty string/array/object to mean "missing".
- **At API/route/store boundaries, validate input types** (`typeof`, `Array.isArray`, schema) and return/throw a clear error rather than letting `null`/`undefined` propagate into business logic.
- `no-explicit-any` — **no `any`**; use `unknown` and narrow, or a precise type.
- `no-non-null-assertion` — **no `!`/`x!`** non-null assertions.
- `@typescript-eslint/no-deprecated` — **no deprecated APIs**: never use anything marked `@deprecated` (Node built-ins, Mongoose/React APIs, our own code); migrate to the documented replacement (e.g. Mongoose `{ new: true }` → `{ returnDocument: 'after' }`, React `FormEvent` → `SubmitEventHandler`). CI fails on any hit. (Applies to application source; the ESLint configs themselves retain core formatting rules by separate decision.)
- `consistent-type-definitions: interface` — **prefer `interface` over `type` alias**.
- `no-unnecessary-condition` — drop conditions TS knows are always truthy/falsy (warn in backend; warn in frontend `.tsx`, off in frontend `.ts`).

### Readability & structure
- `explicit-function-return-type` — **explicit return types on exported functions and store actions** (warn in backend with `allowExpressions`; **error** on frontend `.ts` files).
- `no-else-return` — **early returns / guard clauses over `if/else` pyramids**.
- `max-params: 4` — **at most 4 parameters**; beyond 3, prefer a single options object over positional params.
- Functions are **small, single-purpose, and verb-led** (`calculateTotal()`).
- `no-unused-vars` — unused params/vars must be prefixed `_` or `_<name>`.

### Naming (ESLint `naming-convention` + CONVENTION.md)
- **Interfaces** are `PascalCase` **and must start with `I`** (`^I[A-Z]`): `IConfig`, `IPost`, `IAuthedRequest`.
- **Classes, type aliases, and enums** are `PascalCase`.
- **Functions** are verb-led `camelCase` (frontend also permits `PascalCase` for component-returning factories).
- **Variables/properties** are `camelCase`; **config constants and enums** are `SCREAMING_SNAKE_CASE`.
- **Parameters** are `camelCase`; leading/trailing `_` allowed.

### Filenames
- **Backend** is `snake_case` with a role suffix — `file.functionality_in_singular.ts` inside `models/`, `controllers/`, `routes/`, `middlewares/` (`post.model.ts`, `post.controller.ts`, `post.route.ts`); type-settings files are `file.type.ts`.
- **Frontend** is idiomatic React — `PascalCase.tsx` for components (default export matches the file, e.g. `PostCard.tsx` → `PostCard`), `camelCase.ts` for stores/hooks/lib (`authStore.ts`, `api.ts`, `types.ts`). Interfaces stay `I…`; everything else is identical to the backend.

### Export style
- **Simplify `export`** — declare and export on one line when possible: `export default class Config implements IConfig { … }`, not a trailing separate `export default Config`.

When style is uncertain, trust `CONVENTION.md` and the ESLint configs over general TypeScript habits.
