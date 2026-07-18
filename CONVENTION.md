# General naming conventions
- Use `camelCase` for variables, properties, and normal constants (e.g. `firstName`)
- Use `camelCase` for functions and methods. Those should always start with a verb stating the action of the function (e.g. `calculateTotal()`)
- Use `SCREAMING_SNAKE_CASE` for constants used specifically for config purposes, and enums.
- Use `PascalCase` for classes, interfaces.
- Use `snake_case.extension` for filename.
- Interface must have the prefix `I...` before the naming.

# Files naming conventions
- All types setting must be named `file.type.ts`
- Modules inside `models/`, `controllers/`, `routes/`, `middlewares/` should be named `file.functionality_in_singular.ts` (e.g. `post.model.ts`)

## Frontend exception (React)
The `snake_case` filename rule applies to the backend. The frontend follows idiomatic React naming instead:
- React component files and their default export use `PascalCase` (e.g. `PostCard.tsx` exporting `PostCard`)
- Stores, hooks, and plain library modules use `camelCase` (e.g. `authStore.ts`, `api.ts`, `types.ts`)
- Everything else (interfaces prefixed `I...`, `camelCase` variables/functions, `PascalCase` types, no semicolons, single quotes, 4-space indent) stays identical to the backend

# Rules and general conventions
- All variables should be set to constants if possible
- Parameters that must be stated, but not used, have to be clearly stated with `_` or `_<name>`
- Use `<space>` for indentation, preferably 4 spaces
- Must remove all redundant newlines `\n`, spaces,...

# Semantic conventions
- Do not add `;` at every line of code.
- Simplify `export` by appending everything on a line if possible
- Only strings used for logging or contents should be put inside a pair of `""`. Otherwise, e.g. `process.env['PORT']`, should only be put inside a `''`
- Always use `null` instead of `undefined` for a more consistent typing 


e.g.

```typescript
export default class Config implements IConfig {
    ...
}
``` 
instead of
```typescript
class Config implements IConfig {
    ...
}

export default Config
```

# Null and undefined handling
- Always use `null` (never `undefined`) to represent an absent *value*, per the existing rule
- Functions that may have no result must return `null`, never `undefined`
- Optional *function parameters* may use the idiomatic `?` marker (e.g. `getPosts(owner?: string)`); this is the one accepted place `undefined` appears. Never write an explicit `undefined` value, cast (`x as T` returning `undefined`), or `: undefined` branch — use `null`
- Narrow nullable values with an explicit guard before use; prefer an early-return guard over long optional-chaining chains when the absence is an error or needs a fallback:
  - good: `if (user === null) return null` then use `user` safely afterwards
  - avoid: `user?.profile?.name` deep chains that hide which part was missing
- Distinguish "absent" (`null`) from "empty" (`''`, `[]`, `{}`); do not use an empty string/array to mean "missing"
- At boundaries (API/route handlers/store actions), validate input types (`typeof`, `Array.isArray`, schema checks) and return or throw a clear error instead of letting `null`/`undefined` propagate into business logic

# Readability conventions
- Use guard clauses and early returns to reduce nesting; avoid deep `if/else` pyramids
- Annotate explicit return types on exported functions and store actions so callers see the contract at a glance
- Prefer a single options object over 3 or more positional parameters
- Avoid `any`; use `unknown` and narrow it, or a precise type
- Prefer `const`; only use `let` when reassignment is required, and keep its scope as tight as possible
- Keep functions small and single-purpose; a function name starting with a verb should do exactly that one action

# Import path conventions
- Use the `@/` path alias for any import that leaves the current directory (backend `@/` → backend root, frontend `@/` → `src/`)
- Same-directory imports stay relative (`./sibling`); cross-directory `../…` is **forbidden** — enforced by the ESLint rule `alias/no-cross-dir-relative` in both packages
- Never "simplify" an `@/…` import to a relative path; the backend build (`tsc-alias`) and frontend lint depend on the alias

# Non-deprecated usage
- Never use an API, option, or symbol marked `@deprecated` — in Node built-ins, Mongoose, React, or our own code. Always reach for the documented replacement in the same change
- Enforced by the `@typescript-eslint/no-deprecated` rule (error) in **both** ESLint configs; it is type-aware (uses `projectService`) so it catches deprecated surfaces across the dependency graph, not just by name. CI runs lint and fails on any deprecated usage, so the codebase can never drift onto a deprecated surface
- When a dependency deprecates something you use, migrate immediately (e.g. Mongoose `{ new: true }` → `{ returnDocument: 'after' }`; React 19 `FormEvent` → `SubmitEventHandler<HTMLFormElement>`), and add a regression guard if the call site is non-obvious
- Scope: this governs application/runtime source. The ESLint config files themselves intentionally retain ESLint's core formatting rules (`semi`, `indent`, …); that is a separate, documented decision, not a violation
