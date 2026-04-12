# types/

Shared TypeScript types and enums used across both client and server.

## When to put something here

- Domain types that don't belong to a specific domain's database layer (e.g. `User`, `Organization` shapes used in UI)
- API request/response types shared between route handlers and fetchers
- Form value types derived from Zod schemas but imported by React components
- UI types (table column defs, filter state shapes) that multiple features reuse

## When NOT to put something here

- **Zod schemas** → `schemas/` (they live next to the validation, not the types)
- **Constants / enums-as-objects** → `constants/`
- **Drizzle-coupled entity types** → `core/<domain>/entity.ts`
- **One-off types used by a single component** → define inline in that file

## Suggested structure

```
types/
├── domain/       # Cross-cutting domain types (User, Organization, etc.)
├── api/          # API request/response shapes
├── forms/        # Form value types derived from schemas
└── ui/           # UI-specific types (ColumnDef, SortState, etc.)
```

Currently empty - extract types here as the codebase grows.
