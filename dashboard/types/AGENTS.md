# types/ — Type Definition Rules

> **Parent**: [`dashboard/AGENTS.md`](../AGENTS.md) · **Scope**: `types/` directory

---

## Purpose

Central type definitions shared across client components, API routes, and server-side code.

## Rules

1. **Shared types only** — types used by a single file should live in that file
2. **Export all types** — every type in this directory must be exported
3. **No runtime code** — this folder is for type declarations only (`.ts`, not `.tsx`)
4. **Naming conventions**:
   - Interfaces: `PascalCase` (e.g., `Task`, `Subtask`, `Agent`)
   - Enums/unions: `PascalCase` (e.g., `TaskStatus`, `Priority`)
   - Utility types: descriptive PascalCase (e.g., `TaskCreateInput`)
5. **Derive from schema** — whenever possible, derive types from Drizzle schema using `InferSelectModel<>` / `InferInsertModel<>`
6. **Zod co-location** — if a type has a corresponding Zod schema for validation, define both in the same file
7. **No `any`** — use `unknown` for genuinely unknown types, then narrow

## Current Files

| File       | Contents                                    |
| ---------- | ------------------------------------------- |
| `tasks.ts` | `Task`, `Subtask`, `TaskStatus`, `Priority`, `Phase` types |
