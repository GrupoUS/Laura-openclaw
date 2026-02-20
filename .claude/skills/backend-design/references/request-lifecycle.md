# Request Lifecycle Maps — Hono Runtime

Use these maps as canonical execution flow for backend implementation and incident triage.

## Core API Lifecycle (Hono)

```mermaid
flowchart TD
    A["HTTP request enters Hono"] --> B["Global middleware (logger, cors, secureHeaders)"]
    B --> C["Auth middleware (Clerk)"]
    C --> D["Route middleware (rate limit, guards)"]
    D --> E["Context build (user, mentorado, logger)"]
    E --> F["tRPC procedure boundary (public/protected/mentorado/admin)"]
    F --> G["Service orchestration and domain validation"]
    G --> H["Drizzle query/mutation path"]
    H --> I["External adapter calls (if needed)"]
    I --> J["Response contract mapping"]
    J --> K["Structured logs and metrics emitted"]
```

## Auth and Context Lifecycle

```mermaid
flowchart TD
    A["Request with auth token"] --> B["Clerk identity via getAuth(c)"]
    B --> C["Session cache lookup (redis then memory)"]
    C -->|Hit| D["User resolved"]
    C -->|Miss| E["Source sync and upsert"]
    E --> F["Dual-write cache refresh"]
    D --> G["Resolve role and mentorado linkage"]
    F --> G
    G --> H["Procedure middleware authorization"]
    H --> I["Proceed or fail with explicit code"]
```

## Webhook Lifecycle

```mermaid
flowchart TD
    A["Provider sends webhook"] --> B["Read raw body + verify signature"]
    B --> C["Dedup check with event id"]
    C --> D["Persist ingress for critical events"]
    D --> E["ACK fast (200/202)"]
    E --> F["Async processing and side effects"]
    F --> G["Classify failures: retryable vs terminal"]
    G --> H["Retry / dead-letter / success mark"]
```

## SSE Lifecycle (Broadcast Service Model)

```mermaid
flowchart TD
    A["Client opens /api/chat/events"] --> B["Auth + mentorado resolution"]
    B --> C["Bind Node outgoing response"]
    C --> D["Register client in SSE service"]
    D --> E["Broadcast domain events to connected clients"]
    E --> F["Connection close event"]
    F --> G["Remove client and release references"]
```

## External API Lifecycle

```mermaid
flowchart TD
    A["Service requests provider operation"] --> B["Adapter input validation"]
    B --> C["Timeout budget applied"]
    C --> D["Provider request"]
    D -->|2xx| E["Normalize response"]
    D -->|429 or 5xx| F["Retry policy with jitter"]
    F --> G["Circuit state evaluation"]
    G --> H["Degrade gracefully or recover"]
    E --> I["Persist and return domain result"]
    H --> I
```

## Validation Points by Stage

| Stage | Must Validate |
|---|---|
| Edge | request size, rate limit, route trust |
| Auth | token validity, identity stability |
| Context | role linkage, mentorado linkage, correlation logger |
| Service | domain invariants, idempotency presence |
| DB | index-aware query, conflict-safe writes |
| External | timeout, retry class, rate-limit behavior |
| Response | stable error contract + correlation id |

## Hono API Quick Reference

| Operation | Hono API |
|---|---|
| Parse JSON body | `await c.req.json()` |
| Parse text body | `await c.req.text()` |
| Read query param | `c.req.query("foo")` |
| Read path param | `c.req.param("id")` |
| Read header | `c.req.header("x")` |
| JSON response | `c.json(data, 200)` |
| Redirect | `c.redirect(url)` |
| Middleware signature | `async (c, next) => { ... await next(); }` |
| Error handler | `app.onError((err, c) => ...)` |
