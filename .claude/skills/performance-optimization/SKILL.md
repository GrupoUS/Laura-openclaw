---
name: performance-optimization
description: Use when optimizing runtime and build performance, running security baseline checks, or improving SEO/GEO readiness in one workflow. Triggers on slow pages, poor LCP/INP/CLS, large bundles, high API latency, vulnerability checks, headers, robots/sitemap, and search visibility regressions.
---

# Performance Optimization

Single performance skill for three goals: speed, security baseline, and SEO/GEO baseline.

## Core Rules

1. Measure before changing code.
2. Change one bottleneck at a time.
3. Re-measure with the same tool and scenario.
4. Keep fixes minimal (KISS) and only for active issues (YAGNI).

## Packs

Pick one pack per run:

| Pack                | Use When                                                      | Minimum Output                               |
| ------------------- | ------------------------------------------------------------- | -------------------------------------------- |
| `performance-core`  | Slow load, sluggish interaction, high API p95, large bundle   | before/after metrics + exact fixes           |
| `security-baseline` | Release hardening, OWASP sanity, dependency and header checks | findings by severity + mitigation            |
| `seo-geo-baseline`  | Search visibility, crawlability, AI citation readiness        | indexability/schema/CWV report + action list |

## Baseline Commands

```bash
bun run check
bun run lint:check
bun run build
ANALYZE=true bun run build
```

## Pack Commands

### `performance-core`

```bash
CHROME_PATH=/usr/bin/google-chrome npx lighthouse https://staging.neondash.com.br --preset=desktop --port=9222 --chrome-flags="--headless=new --disable-gpu --no-first-run --no-default-browser-check --disable-background-networking --disable-extensions"
CHROME_PATH=/usr/bin/google-chrome npx lighthouse https://neondash.com.br --preset=desktop --port=9333 --chrome-flags="--headless=new --disable-gpu --no-first-run --no-default-browser-check --disable-background-networking --disable-extensions"
npx -y react-doctor@latest . --yes --verbose
```

React Doctor remediation loop (required in `performance-core`):

1. Run `npx -y react-doctor@latest . --yes --verbose` and capture diagnostics.
2. Fix `error` severity suggestions first (correctness/security/performance).
3. Fix high-impact `warning` suggestions (render churn, dead code, bundle bloat).
4. Re-run `npx -y react-doctor@latest . --yes --score`.
5. Repeat until score reaches target for the sprint (recommended: `>= 75`).

Use `--project` for monorepos when needed:

```bash
npx -y react-doctor@latest . --yes --project @neondash/web --verbose
```

Optional auto-fix assistant mode:

```bash
npx -y react-doctor@latest . --yes --fix
```

Always review generated changes before keeping them.

Common React Doctor fixes to apply immediately:

- `React Hook called conditionally`: move hook calls to top-level and guard inside effect/body.
- `Import "m" with LazyMotion`: replace `motion` import with `LazyMotion` + `m` to reduce bundle size.
- `heavy library (recharts)`: lazy-load chart modules with `React.lazy` and `Suspense`.
- `component too large`: split into focused subcomponents and move logic to hooks/services.
- `useState initialized from prop`: derive value in render or sync explicitly with guarded effect.
- `array index as key`: use stable IDs (`id`, `slug`, `uuid`) to avoid list bugs.
- `default [] prop`: hoist default arrays/objects to module-level constants for stable references.

After each batch of fixes, run:

```bash
npx -y react-doctor@latest . --yes --score
bun run check && bun run lint:check && bun run test
```

Use DevTools Performance/Memory and `react-scan` for render hotspots.

### `security-baseline`

```bash
bun audit
gitleaks detect --source .
curl -I https://staging.neondash.com.br
```

Check at least: access control, injection resistance, auth flows, misconfiguration, secrets.

### `seo-geo-baseline`

```bash
CHROME_PATH=/usr/bin/google-chrome npx lighthouse https://staging.neondash.com.br --preset=desktop --port=9222 --chrome-flags="--headless=new --disable-gpu --no-first-run --no-default-browser-check --disable-background-networking --disable-extensions"
CHROME_PATH=/usr/bin/google-chrome npx lighthouse https://neondash.com.br --preset=desktop --port=9333 --chrome-flags="--headless=new --disable-gpu --no-first-run --no-default-browser-check --disable-background-networking --disable-extensions"
curl https://staging.neondash.com.br/robots.txt
curl https://neondash.com.br/robots.txt
```

Use distinct explicit ports for sequential runs (`9222` for staging, `9333` for production).
If you run in WSL, prefer Linux Chrome via `CHROME_PATH=/usr/bin/google-chrome` to avoid Windows temp permission cleanup errors.

Check at least: metadata, structured data, canonical links, robots, sitemap, CWV.

## SEO Optimization Playbook (Robots + Sitemap)

Use this playbook when improving indexability for `neondash.com.br`.

### Phase 0 - Discover First

Always confirm stack before implementation:

- frontend framework and router (`Next.js App Router` vs `Vite + TanStack Router`)
- existing robots/sitemap files and runtime endpoints
- private and dynamic routes that must not be indexed
- metadata strategy (global + route-level)

Current project baseline (verified):

- frontend is `Vite + React + TanStack Router` (not Next.js App Router)
- no `app/robots.ts` or `app/sitemap.ts` structure exists
- no `apps/web/public/robots.txt` and no `apps/web/public/sitemap.xml`
- `https://neondash.com.br/robots.txt` and `/sitemap.xml` currently return SPA HTML (`text/html`), not real robots/sitemap content

### Findings Table Template

Use this table in every SEO execution report:

| #   | Finding                                  | Confidence (1-5) | Source                                                    | Impact |
| --- | ---------------------------------------- | ---------------- | --------------------------------------------------------- | ------ |
| 1   | Current robots.txt status                | 5                | `apps/web/public` + curl response                         | High   |
| 2   | Sitemap generation strategy              | 5                | `apps/web/public` + curl response                         | High   |
| 3   | Existing metadata patterns               | 5                | `apps/web/index.html`                                     | Medium |
| 4   | Dynamic/private routes needing exclusion | 5                | `apps/web/src/routeTree.gen.ts` + `routes/_dashboard.tsx` | High   |
| 5   | Core Web Vitals current state            | 4                | Lighthouse run artifacts                                  | High   |

### Edge Cases to Check (Minimum)

1. Authenticated routes indexed by accident (`/meu-dashboard`, `/clientes`, `/pacientes`, `/workspace`, `/configuracoes`).
2. Tokenized routes indexed (`/unsubscribe/$token`).
3. Missing canonical for public legal/onboarding pages.
4. Missing `og:image` absolute URL for public sharing.
5. Sitemap present but serving HTML fallback instead of XML.
6. robots/sitemap returning 200 with wrong content-type (`text/html` instead of `text/plain`/`application/xml`).

### Implementation Strategy by Stack

#### A) Next.js App Router projects (reference pattern)

Use native metadata files:

- `app/robots.ts`
- `app/sitemap.ts`
- `metadataBase` in `app/layout.tsx`

For robots policy, always disallow private routes and keep crawler allowlist behavior safe:

- disallow at least: `/api/`, `/dashboard/`, `/admin/`, `/_next/`, `/auth/`
- include `sitemap` and `host`
- do not globally block all crawlers

#### B) Current NeonDash stack (Vite + TanStack Router + Hono)

Use static assets served by frontend build output:

- create `apps/web/public/robots.txt`
- create `apps/web/public/sitemap.xml`

Recommended `robots.txt` policy for this repo:

```txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard/
Disallow: /meu-dashboard/
Disallow: /configuracoes/
Disallow: /clientes/
Disallow: /pacientes/
Disallow: /workspace/
Disallow: /chat/
Disallow: /financeiro/
Disallow: /crm/
Disallow: /ai-agents/
Disallow: /admin/
Disallow: /unsubscribe/

User-agent: GPTBot
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

Sitemap: https://neondash.com.br/sitemap.xml
Host: https://neondash.com.br
```

Sitemap rules for this repo:

- include only public pages (for example: `/`, `/termos`, `/privacidade`, `/comece-aqui`, `/primeiro-acesso`, `/account-deletion`)
- exclude private/authenticated and tokenized routes
- include `<lastmod>` for every URL

### Metadata Rules

For Next.js projects:

- always set `metadataBase`
- always use title template (`%s | NeonDash`)
- always set canonical and OG/Twitter image metadata

For current Vite project:

- maintain base metadata in `apps/web/index.html`
- add route-level title/description/canonical management for public pages only
- ensure meaningful images do not use empty `alt` text

### Core Web Vitals Targets

- `LCP < 2.5s`
- `INP < 200ms`
- `CLS < 0.1`
- `TTFB < 600ms`

### Validation Commands

```bash
# Robots and sitemap must be real files (not SPA HTML)
curl -I https://neondash.com.br/robots.txt
curl -I https://neondash.com.br/sitemap.xml

# Verify content type + payload start
python3 - <<'PY'
import urllib.request
for u in ['https://neondash.com.br/robots.txt','https://neondash.com.br/sitemap.xml']:
    with urllib.request.urlopen(u, timeout=30) as r:
        body = r.read(80).decode('utf-8', errors='replace')
        print(u, r.status, r.headers.get('content-type'), repr(body))
PY

# Lighthouse SEO/Performance
CHROME_PATH=/usr/bin/google-chrome npx lighthouse https://neondash.com.br --preset=desktop --port=9333 --chrome-flags="--headless=new --disable-gpu --no-first-run --no-default-browser-check --disable-background-networking --disable-extensions" --output json --output-path=/tmp/lh-prod-seo.json
```

### Non-Negotiable Constraints

- Never index private areas (`/api/`, `/dashboard/`, `/admin/`, `/auth/`, and equivalent private business paths).
- Never apply Next.js `app/robots.ts` guidance to non-Next stacks.
- Never ship sitemap entries without `lastmod`.
- Never block all crawlers globally.
- Never skip post-deploy curl validation.

### Success Criteria

- `/robots.txt` returns 200 with `text/plain` and expected disallow rules.
- `/sitemap.xml` returns 200 with XML content-type and valid URL set.
- URLs in sitemap return 200 and are public pages.
- Lighthouse SEO score reaches `>= 0.95` on production.
- Public pages have unique and stable title/description/canonical strategy.

## Targets

| Metric      | Target   |
| ----------- | -------- |
| LCP         | <= 2.5s  |
| INP         | <= 200ms |
| CLS         | <= 0.1   |
| API p95     | <= 140ms |
| Main bundle | <= 200KB |

## Bottleneck Routing

- Initial load slow -> inspect critical rendering path and bundle split.
- Interaction slow -> inspect re-renders and long handlers.
- API slow -> inspect N+1 patterns and missing indexes.
- Memory growth -> inspect subscription/listener/interval cleanup.

## High-Value Fixes

### Frontend

- Route-level lazy loading for heavy pages and modals.
- Remove unstable props/callbacks causing unnecessary re-renders.
- Virtualize long lists.

### Backend/DB

- Remove N+1 queries with joins or batch strategy.
- Ensure FK columns are indexed.
- Avoid unbounded list queries.

## Guardrails

- Do not optimize based on intuition only.
- Do not over-memoize cheap operations.
- Do not expand scope to unrelated refactors.
- Do not claim improvement without before/after evidence.

## Report Template

```markdown
## Optimization Report

Pack: [performance-core|security-baseline|seo-geo-baseline]

| Metric | Before | After | Delta |
| ------ | ------ | ----- | ----- |
| ...    | ...    | ...   | ...   |

### Changes

1. [change] -> [impact]
2. [change] -> [impact]

### Risks / Follow-up

- [remaining risk]
```
