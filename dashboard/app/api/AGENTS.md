# api/ — API Route Handler Rules

> **Parent**: [`app/AGENTS.md`](../AGENTS.md) · **Scope**: `app/api/` directory

---

## Directory Structure

```text
api/
├── tasks/          # CRUD + status mutations for tasks/subtasks
├── agents/         # Agent CRUD + status endpoints
├── analytics/      # Aggregated metrics (KPIs, charts)
├── events/         # SSE endpoint (real-time task updates)
├── auth/           # Login/logout session management
├── activity/       # Activity feed (agent logs)
└── health/         # Healthcheck for Railway
```

---

## API Route Conventions

### Request Handlers

```typescript
// ✅ Always export named HTTP methods
export async function GET(request: Request) { ... }
export async function POST(request: Request) { ... }
export async function PATCH(request: Request) { ... }
```

### Authentication

- **Every route (except `health/` and `auth/login`)** must validate session:
  ```typescript
  const session = await getSessionFromCookies(request);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  ```
- Use `lib/session.ts` — never re-implement session logic

### Response Patterns

```typescript
// ✅ Success
return Response.json({ data: result });

// ✅ Error with proper status
return Response.json({ error: "Not found" }, { status: 404 });

// ✅ Empty success
return new Response(null, { status: 204 });
```

### Input Validation

- Always validate request body with Zod before processing
- Use `request.json()` with try-catch (body may be malformed)
- Validate URL parameters from `request.url` or `params`

---

## SSE Endpoint (`events/`)

```typescript
// SSE must return ReadableStream with proper headers
return new Response(stream, {
  headers: {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  },
});
```

- Auth via query parameter (`?token=...`) since EventSource can't set headers
- Always send heartbeat pings to prevent timeout
- Clean up Redis subscriptions on client disconnect

## Healthcheck (`health/`)

- Must return `200 OK` with `{ status: "ok" }` for Railway
- No authentication required
- Include database connectivity check if feasible

## Mutations

- After any task/subtask mutation (create, update, delete), **emit event** via EventBus:
  ```typescript
  eventBus.emit("task:updated", { taskId, changes });
  ```
- This triggers SSE updates to all connected clients
