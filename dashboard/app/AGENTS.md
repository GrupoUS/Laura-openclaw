# app/ — Next.js App Router Rules

> **Parent**: [`dashboard/AGENTS.md`](../AGENTS.md) · **Scope**: `app/` directory

---

## Directory Conventions

```text
app/
├── (dashboard)/         # Route group — no URL segment, shares layout
│   ├── board/           # /board — Kanban view
│   ├── agents/          # /agents — Agent monitoring
│   ├── analytics/       # /analytics — Charts dashboard
│   ├── list/            # /list — Table view
│   ├── layout.tsx       # Dashboard shell (sidebar + header)
│   └── page.tsx         # / — redirects to /board
├── api/                 # API route handlers
├── login/               # /login — authentication page
├── layout.tsx           # Root layout (HTML, body, fonts, CSS)
├── page.tsx             # Root page (redirect)
├── globals.css          # Tailwind v4 + custom properties
└── startup.ts           # Server-side startup logic
```

---

## Page Rules

1. **Route groups** `(dashboard)` — wrap with shared layout, no URL impact
2. **Pages must be lean** — orchestrate components, no business logic
3. **`layout.tsx`** — add metadata, fonts, global providers; never use `'use client'`
4. **`page.tsx`** — always export `default` function, use `Suspense` for async data
5. **Loading states** — create `loading.tsx` for route-level suspense boundaries
6. **Error boundaries** — create `error.tsx` with `'use client'` for error handling
7. **Metadata** — use Next.js `metadata` export or `generateMetadata()` for SEO

## Data Fetching

- **Server Components**: fetch data directly (no API call needed)
- **Client Components**: use hooks from `hooks/` (Zustand, SSE)
- Never use `getServerSideProps` or `getStaticProps` — this is App Router
- For mutations, call API routes via `fetch()` or dedicated lib functions

## CSS

- `globals.css` contains Tailwind v4 directives and CSS custom properties
- Component styles: use Tailwind utility classes inline
- Never create separate `.module.css` files — use Tailwind only
- Design tokens (colors, spacing) defined in `tailwind.config.ts`
