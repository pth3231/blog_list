# Blog List

A full-stack blog-link aggregator: users register, post interesting article links, like them, and comment. Two independent packages live side by side with **no root orchestration** — run each from its own directory.

```
.
├── backend/     Express + TypeScript REST API (MongoDB via Mongoose)
└── frontend/    React 19 + Vite + Tailwind v4 SPA (Zustand, React Router 7)
```

## Architecture

### Backend (`backend/`)

A layered Express 5 API (CommonJS, compiled with `tsc` + `tsc-alias`). Requests flow in a strict direction:

```
route  →  controller  →  model (Mongoose)
  ↑           │
  └── ServiceResult (typed success/failure envelope)
```

- **`routes/`** — HTTP boundary only. Validates input, authenticates, and translates a `ServiceResult` into a response via the shared helpers in `utils/http_response.ts` (`sendResult`, `parseObjectIdParam`).
- **`controllers/`** — business logic / data access. Every function returns a `ServiceResult<T>` (`{ ok: true, value }` or `{ ok: false, status, message }`), so failures never throw across the boundary.
- **`models/`** — Mongoose schemas (`user`, `post`, `comment`).
- **`middlewares/`** — `authenticateToken` verifies the JWT and attaches `req.user`.
- **`utils/`** — config, logger, DB connection, `ServiceResult` constructors, HTTP helpers.
- **`types/`** — shared interfaces (prefixed `I…`).

The `@/` path alias resolves to the backend root (configured in `tsconfig.json` + `vitest.config.ts`); `tsc-alias` rewrites it in the build output, so keep the alias.

#### API (`/v1`)

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/posts` | | List posts (optional `?owner=`) |
| `POST` | `/posts` | ✅ | Create a post |
| `GET` | `/posts/count?owner=` | | Count posts by owner |
| `GET` | `/posts/:id` | | Get one post |
| `DELETE` | `/posts/:id` | ✅ | Delete a post (204) |
| `POST` | `/posts/:id/like` | ✅ | Toggle like |
| `GET`/`POST` | `/posts/:id/comments` | POST ✅ | List / add comments |
| `POST` | `/auth/register`, `/auth/login` | | Auth, returns JWT |
| `GET` | `/auth/me` | ✅ | Current user |
| `GET` | `/health`, `/health/live`, `/health/ready` | | Probes |

### Frontend (`frontend/`)

A React 19 SPA (ESM, built by Vite, React Compiler enabled). It talks to the backend through a thin `lib/api.ts` wrapper over `fetch`, and holds server state in Zustand stores (`authStore`, `postsStore`, `commentsStore`) keyed by id for normalized lookups.

- **`pages/`** — route components (one per route).
- **`components/`** — presentational React components (PascalCase).
- **`store/`** — Zustand stores (camelCase), each action annotated with an explicit return type.
- **`lib/`** — `api.ts` (HTTP client) and `types.ts` (shared interfaces).

Vite proxies `/v1` → `http://localhost:3000` (`vite.config.ts`), so in development the SPA and API appear on the same origin.

## Conventions

See [`CONVENTION.md`](./CONVENTION.md) for the full rules. Highlights:

- No semicolons, single quotes, 4-space indent, no trailing commas.
- Backend filenames are `snake_case` (`post.model.ts`); the frontend uses idiomatic React naming (`PostCard.tsx`, `authStore.ts`).
- Interfaces are prefixed `I…`; functions are verb-led `camelCase`.
- `null` (never `undefined`) represents an absent value; optional `?` parameters are the one accepted `undefined`.
- Explicit return types on exported functions/store actions; guard clauses over `if/else` pyramids; no `any`.
- Style is enforced by ESLint in **both** packages (`backend/eslint.config.mjs`, `frontend/eslint.config.js`).

## Running locally

Backend needs a MongoDB. For tests, start the container first:

```bash
docker compose -f backend/compose.yaml up -d   # blog-list-mongo-test :27017
```

```bash
# terminal 1 — API on :3000
cd backend
cp .env.example .env          # set PORT, MONGODB_URI, JWT_SECRET
npm install
npm run dev                   # tsx watch; logs requests via morgan('dev')

# terminal 2 — SPA on :5173 (proxies /v1 → :3000)
cd frontend
npm install
npm run dev
```

Other commands:

```bash
cd backend && npm test        # vitest integration suite (needs Mongo)
cd backend && npm run build   # emits to ../build/backend
cd frontend && npm run build  # tsc -b && vite build
```

## Testing

Backend integration tests (`backend/tests/integration/*`) hit a **real** MongoDB — no mocks. Each suite uses a unique database via `uniqueDbUri()`. The `vitest` config hardcodes `JWT_SECRET`, so tests need no `.env`.
