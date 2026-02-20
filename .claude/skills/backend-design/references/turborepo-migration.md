# TurboRepo Monorepo Migration Guide (Phase 2)

> **Status:** Pre-migration reference. Apply when TurboRepo monorepo restructuring begins.

## Objective

Refactor the Neondash project from a monolithic repository to a TurboRepo-managed monorepo. Separate frontend, backend, and shared code into independent workspaces with explicit dependency graphs and build caching.

## Target Directory Structure

```
neondash/
├── apps/
│   ├── api/                    # @repo/api — Hono + tRPC backend
│   │   ├── src/
│   │   │   ├── _core/          # Server init, middleware, context
│   │   │   ├── routers/        # tRPC routers
│   │   │   ├── services/       # Business logic
│   │   │   └── index.ts        # Entry point
│   │   ├── package.json        # name: "@repo/api"
│   │   └── tsconfig.json       # extends @repo/config
│   └── web/                    # @repo/web — React + Vite frontend
│       ├── src/
│       │   ├── components/
│       │   ├── routes/
│       │   └── main.tsx
│       ├── package.json        # name: "@repo/web"
│       └── tsconfig.json       # extends @repo/config
├── packages/
│   ├── shared/                 # @repo/shared — Types + schemas
│   │   ├── src/
│   │   │   ├── router.ts       # AppRouter type re-export
│   │   │   ├── schemas.ts      # Shared Zod schemas
│   │   │   ├── types.ts        # Shared TypeScript types
│   │   │   └── constants.ts    # Shared constants/enums
│   │   ├── package.json        # name: "@repo/shared"
│   │   └── tsconfig.json
│   └── config/                 # @repo/config — Shared configs
│       ├── tsconfig.base.json
│       ├── biome.json
│       └── package.json        # name: "@repo/config"
├── drizzle/                    # Stays at root (migration tooling)
├── turbo.json                  # Task pipeline
├── package.json                # Root workspace config
└── bun.lock
```

## Workspace Naming Convention

| Workspace | Name | Purpose |
|---|---|---|
| `apps/api` | `@repo/api` | Hono + tRPC backend server |
| `apps/web` | `@repo/web` | React + Vite frontend |
| `packages/shared` | `@repo/shared` | Types, schemas, and utilities |
| `packages/config` | `@repo/config` | Shared tsconfig.json and biome.json |

## Shared Code Extraction Strategy

### What Moves to `@repo/shared`

| Code | Current Location | New Location | Reason |
|---|---|---|---|
| `AppRouter` type | `server/routers/index.ts` | `packages/shared/src/router.ts` | Frontend tRPC client needs this type |
| Zod schemas | Various server/client files | `packages/shared/src/schemas.ts` | Validation shared between client and server |
| Utility functions | `server/utils/`, `client/src/lib/` | `packages/shared/src/utils.ts` | Functions used in both apps |
| Constants, enums | Scattered | `packages/shared/src/constants.ts` | Shared configuration values |

### What Stays in `@repo/api`

- All tRPC router handlers and business logic
- Service layer (`services/`)
- Database queries and Drizzle schema
- Webhook handlers (Stripe, Clerk, Meta, WhatsApp)
- Auth context composition
- Middleware configuration
- Health check endpoints

### What Stays in `@repo/web`

- React components and pages
- TanStack Router configuration
- Clerk frontend auth components
- UI hooks and state management

## Import Path Migration

### Before (Monolithic)

```typescript
// In server code
import { leadSchema } from '../../shared/schemas';
import type { AppRouter } from '../routers';

// In client code
import type { AppRouter } from '../../server/routers';
import { leadSchema } from '../../shared/schemas';
```

### After (Monorepo)

```typescript
// In apps/api
import { leadSchema } from '@repo/shared/schemas';
import type { AppRouter } from '@repo/shared/router';

// In apps/web
import type { AppRouter } from '@repo/shared/router';
import { leadSchema } from '@repo/shared/schemas';
```

## Bun Workspaces Configuration

**Root `package.json`:**

```json
{
  "name": "neondash-monorepo",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "check": "turbo run check",
    "lint:check": "turbo run lint:check",
    "test": "turbo run test"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  },
  "packageManager": "bun@1.2.0"
}
```

### Bun CLI Gotchas (validated in this repo)

- Use `workspaces` in root `package.json` as the operational source of truth.
- `bun.workspaces` can exist for compatibility, but should mirror `package.json`.
- `bun add -w ...` is not supported in current Bun used by this project. Use root cwd + `bun add -d <pkg>` instead.
- `bun pm ls -w` is not supported. Validate workspaces via `bun pm pkg get workspaces`.

**`apps/api/package.json`:**

```json
{
  "name": "@repo/api",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "bun --watch run src/index.ts",
    "build": "bun build src/index.ts --outdir=dist",
    "check": "tsc --noEmit",
    "lint:check": "biome check .",
    "test": "bun test"
  },
  "dependencies": {
    "@repo/shared": "workspace:*",
    "hono": "^4.x",
    "@hono/trpc-server": "^0.x",
    "@hono/node-server": "^1.x"
  },
  "devDependencies": {
    "@repo/config": "workspace:*"
  }
}
```

**`packages/shared/package.json`:**

```json
{
  "name": "@repo/shared",
  "version": "0.0.0",
  "private": true,
  "exports": {
    "./router": "./src/router.ts",
    "./schemas": "./src/schemas.ts",
    "./types": "./src/types.ts",
    "./constants": "./src/constants.ts"
  },
  "devDependencies": {
    "@repo/config": "workspace:*",
    "zod": "^3.x"
  }
}
```

## turbo.json Task Pipeline

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "check": {
      "dependsOn": ["^build"]
    },
    "lint:check": {},
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

### Root Tasks During Preparation Phase (before moving apps)

When `apps/*` and `packages/*` are still empty, use root tasks to avoid "empty build" in Turbo:

```json
{
  "tasks": {
    "//#build:root": { "outputs": ["dist/**"] },
    "//#check:root": { "outputs": [] },
    "//#test:root": { "outputs": ["coverage/**"] }
  }
}
```

And run:

```bash
turbo run build build:root
turbo run check check:root
turbo run test test:root
```

Key decisions:
- `build` uses `dependsOn: ["^build"]` → builds dependencies first (e.g., `@repo/shared` before `@repo/api`)
- `dev` is `persistent: true` and `cache: false` → long-running watch processes
- `check` depends on `^build` → ensures shared types are compiled before type-checking dependent packages

## tsconfig.json Inheritance

**`packages/config/tsconfig.base.json`:**

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "exclude": ["node_modules"]
}
```

**`apps/api/tsconfig.json`:**

```json
{
  "extends": "@repo/config/tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "outDir": "./dist"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

## Migration Sequence (Atomic Steps)

### Epic 1: Scaffold Monorepo (Zero-risk)

1. Install turbo at root: `bun add -D turbo`
2. Create `turbo.json` with task pipeline
3. Create `apps/` and `packages/` directories
4. Add `workspaces` to root `package.json`
5. **Validate:** `bun install` succeeds

### Epic 2: Extract Shared Package

1. Create `packages/shared/` with `package.json`
2. Create `packages/config/` with shared tsconfig and biome
3. Move shared types, schemas, and constants to `packages/shared/src/`
4. **Validate:** `turbo run check --filter=@repo/shared` passes

### Epic 3: Move Applications

1. Move `server/` → `apps/api/`
2. Move `client/` → `apps/web/`
3. Create app-level `package.json` files with workspace dependencies
4. Create app-level `tsconfig.json` files extending base
5. **Validate:** `turbo run check` passes for all workspaces

### Epic 4: Refactor Imports

1. Replace all relative cross-boundary imports with `@repo/shared/...`
2. Update Vite config for monorepo paths
3. Update tRPC client to import `AppRouter` from `@repo/shared/router`
4. **Validate:** `turbo run build` succeeds, `turbo run dev` starts both apps

### Epic 5: CI/CD and Docker

1. Update Dockerfile with `turbo prune --docker` pattern
2. Update GitHub Actions with `--filter` and `turbo-ignore`
3. Configure remote caching with `TURBO_TOKEN`
4. **Validate:** Full CI/CD pipeline passes, Docker build succeeds

## Rollback Strategy

- Keep changes in atomic commits per Epic
- Each Epic can be reverted independently
- Full rollback: `git checkout` pre-migration commit + `bun install`

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Import path breakage | High | Medium | Automated refactoring + typecheck gate |
| Build config conflicts | Medium | Medium | Test turbo.json locally before push |
| Lock file churn | Medium | Low | Single `bun install` at root, `--frozen-lockfile` in CI |
| Drizzle migration path | Low | High | Keep `drizzle/` at root, don't move to workspace |
| Dev server port conflicts | Low | Low | Configure unique ports per app in turbo dev |
