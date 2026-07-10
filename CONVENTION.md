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
