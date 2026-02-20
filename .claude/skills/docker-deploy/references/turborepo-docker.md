# TurboRepo Docker Deployment

> **Status:** Pre-migration reference. Apply when TurboRepo monorepo restructuring begins.

## Overview

When the project migrates to TurboRepo monorepo structure (`apps/api`, `apps/web`, `packages/shared`), the Dockerfile and CI/CD pipeline must change to use **workspace-scoped builds** via `turbo prune`.

## Target Monorepo Structure

```
neondash/
├── apps/
│   ├── api/           # Hono + tRPC backend (@repo/api)
│   └── web/           # React + Vite frontend (@repo/web)
├── packages/
│   ├── shared/        # Types, schemas, utilities (@repo/shared)
│   └── config/        # tsconfig, biome configs (@repo/config)
├── turbo.json         # Task pipeline configuration
├── package.json       # Root workspace
└── Dockerfile         # Monorepo-aware multi-stage build
```

## turbo prune Workflow

`turbo prune` creates a sparse copy of the monorepo containing only the target workspace and its dependencies. The `--docker` flag splits output for optimal Docker layer caching.

```bash
turbo prune @repo/api --docker
```

Output structure:

```
./out/
├── json/          # Only package.json files → COPY first for dependency caching
│   ├── package.json
│   ├── apps/api/package.json
│   └── packages/shared/package.json
├── full/          # Full source code → COPY after dependency install
│   ├── apps/api/
│   └── packages/shared/
└── bun.lock       # Pruned lockfile (only relevant dependencies)
```

**Key insight:** By copying `json/` first and installing dependencies, then copying `full/`, Docker caches the dependency layer independently from source changes.

## Preparation-Phase Compatibility (before workspace move)

If monorepo directories exist but app code has not moved yet:

- Keep root build script available via Turbo root task (`//#build:root`).
- Use `turbo run build build:root` in CI so Docker build still produces `dist/`.
- Do not switch Dockerfile to `turbo prune` until `apps/api` and shared workspace dependencies are real.

## Monorepo Dockerfile (4-Stage Build)

```dockerfile
# -------- Stage 1: Base --------
FROM oven/bun:1.2-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# -------- Stage 2: Prepare (turbo prune) --------
FROM base AS prepare
RUN bun add -g turbo@^2
COPY . .
RUN turbo prune @repo/api --docker

# -------- Stage 3: Builder --------
FROM base AS builder
WORKDIR /app

# Install dependencies from pruned package.json files (cacheable)
COPY --from=prepare /app/out/json/ .
RUN bun install --frozen-lockfile

# Copy full source and build
COPY --from=prepare /app/out/full/ .

ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_META_APP_ID
ARG VITE_META_CONFIG_ID

ENV NODE_ENV=production
RUN bun run build --filter=@repo/api

# -------- Stage 4: Runtime --------
FROM oven/bun:1.2-alpine AS runtime
WORKDIR /app

# Non-root user
RUN addgroup -g 1001 -S bunuser && \
    adduser -u 1001 -S bunuser -G bunuser

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./package.json

RUN chown -R bunuser:bunuser /app
USER bunuser

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/health/live || exit 1

CMD ["bun", "dist/index.js"]
```

## Current vs Monorepo Dockerfile Comparison

| Aspect | Current (Monolithic) | Monorepo (TurboRepo) |
|---|---|---|
| Stages | 3 (deps → builder → runtime) | 4 (base → prepare → builder → runtime) |
| Pruning | N/A — copies everything | `turbo prune @repo/api --docker` |
| Dependencies | All project dependencies | Only `@repo/api` + transitive deps |
| Build command | `bun run build` | `bun run build --filter=@repo/api` |
| Build context | Entire project | Pruned workspace graph |
| Image size | ~80-100MB | ~60-80MB (fewer dependencies) |
| Cache efficiency | Good | Better (pruned lockfile changes less) |

## .dockerignore Updates for Monorepo

Add to existing `.dockerignore`:

```
# TurboRepo artifacts
.turbo
out/

# Workspace-specific ignores
apps/web/dist
apps/web/node_modules
```

## turbo.json Docker-Relevant Configuration

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

> **Note:** `pipeline` was renamed to `tasks` in Turbo v2. Use `tasks`.

## Bun + Turbo Operational Notes

- Bun workspaces should be declared in root `package.json` (`workspaces` key).
- `bun.workspaces` may be kept for compatibility but is not the primary source of truth.
- On current Bun, avoid `bun add -w`; install from root with `bun add -d turbo`.

## CI/CD with TurboRepo

### GitHub Actions: Selective Builds

```yaml
- name: Build with Turbo
  run: turbo run build --filter=@repo/api

- name: Type Check
  run: turbo run check

- name: Test
  run: turbo run test --filter=@repo/api
```

### turbo-ignore for Selective Deploys

Skip deploys when only irrelevant workspaces change:

```yaml
- name: Check if API changed
  id: check
  run: |
    npx turbo-ignore @repo/api --fallback=HEAD~1 && echo "skip=true" >> $GITHUB_OUTPUT || echo "skip=false" >> $GITHUB_OUTPUT

- name: Deploy to VPS
  if: steps.check.outputs.skip != 'true'
  # ... existing deploy step
```

### Remote Caching

```yaml
env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}
```

Remote cache shares build artifacts between CI runs and developers, reducing build times by up to 6x for unchanged workspaces.

## Migration Checklist

When transitioning from monolithic to monorepo Dockerfile:

- [ ] `turbo prune @repo/api --docker` produces valid output locally
- [ ] Pruned lockfile installs successfully
- [ ] `bun run build --filter=@repo/api` produces `apps/api/dist/`
- [ ] Docker image builds with 4-stage pattern
- [ ] Health checks pass in new container
- [ ] Image size ≤ 80MB
- [ ] CI/CD pipeline updated with `--filter` flags
- [ ] `turbo-ignore` configured for selective deploys
- [ ] Remote cache secrets configured in GitHub
- [ ] `docker-compose.deploy.yml` updated with new image path
