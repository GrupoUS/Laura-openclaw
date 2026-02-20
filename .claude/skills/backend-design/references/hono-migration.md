# Hono Patterns Reference

> Hono is the production runtime for this project. This document captures canonical setup patterns, API mappings, and integration recipes.

## Canonical Setup Pattern

```ts
import { serve, type HttpBindings } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";
import { clerkMiddleware } from "@hono/clerk-auth";
import { trpcServer } from "@hono/trpc-server";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use("*", logger());
app.use("*", cors({ origin: process.env.CORS_ORIGIN ?? "*", credentials: true }));
app.use("*", secureHeaders());
app.use("*", clerkMiddleware());

app.use(
  "/api/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext: (_opts, c) => createContext(c),
  }),
);

serve({ fetch: app.fetch, port: 3000, hostname: "0.0.0.0" });
```

## Middleware Order (Critical)

Always maintain this exact order:

1. `logger()` — request logging
2. `cors(...)` — CORS headers
3. `secureHeaders()` — security headers
4. `clerkMiddleware()` — auth context injection
5. Route-specific middleware (tRPC, webhooks, etc.)

## Hono API Quick Reference

| Operation | Hono API |
|---|---|
| Read JSON body | `await c.req.json()` |
| Read raw body | `await c.req.text()` |
| Read query param | `c.req.query("foo")` |
| Read path param | `c.req.param("id")` |
| Read header | `c.req.header("x-signature")` |
| JSON response | `c.json(data, 200)` |
| Redirect | `c.redirect(url)` |
| Global error handler | `app.onError((err, c) => ...)` |

## Webhook Signature Pattern

```ts
app.post("/api/webhooks/provider", async (c) => {
  const signature = c.req.header("x-signature");
  const rawBody = await c.req.text();

  if (!signature || !verify(signature, rawBody)) {
    return c.json({ error: "Invalid signature" }, 400);
  }

  const event = JSON.parse(rawBody);
  await queueWebhookTask(event); // ACK fast, process async

  return c.json({ received: true }, 202);
});
```

## SSE Pattern

When existing architecture depends on broadcasting via shared service, preserve push model with Node outgoing response access through Hono Node bindings.

```ts
app.get("/api/chat/events", async (c) => {
  const outgoing = c.env.outgoing;
  outgoing.setHeader("Content-Type", "text/event-stream");
  outgoing.setHeader("Cache-Control", "no-cache");
  outgoing.setHeader("Connection", "keep-alive");

  sseService.addClient(mentoradoId, outgoing);
  outgoing.on("close", () => sseService.removeClient(mentoradoId, outgoing));

  return new Response(null, { status: 200 });
});
```

If manual binding behavior is unstable in runtime, fallback to `streamSSE` and migrate broadcast service accordingly.

## Do / Don't

Do:
- Keep route contracts stable.
- Verify signatures before parsing trusted payloads.
- Preserve fast ACK + async processing for webhook flows.
- Maintain deterministic middleware order: `logger → cors → secureHeaders → clerkMiddleware`.
- Use `c.env.outgoing` for SSE Node.js response access.

Don't:
- Don't mix legacy Node.js patterns with Hono Web API patterns.
- Don't bypass Hono middleware order for convenience.
- Don't merge without subsystem smoke verification.

## Validation Commands

```bash
bun run check
bun test server
curl -i http://localhost:3000/health/live
curl -i http://localhost:3000/health/ready
```

## TurboRepo Integration (Phase 2)

When migrating to TurboRepo monorepo, the Hono backend moves to `apps/api/`:

| Current | Monorepo |
|---|---|
| `server/_core/index.ts` | `apps/api/src/_core/index.ts` |
| `server/routers/` | `apps/api/src/routers/` |
| `server/services/` | `apps/api/src/services/` |
| `import type { AppRouter }` from relative path | `import type { AppRouter }` from `@repo/shared/router` |

Key considerations:
- Hono setup patterns remain unchanged — only file locations change
- Middleware order (`logger → cors → secureHeaders → clerkMiddleware`) is framework-level, not affected by monorepo
- `drizzle/` stays at root for migration tooling

→ Full guide: [turborepo-migration.md](turborepo-migration.md)
