---
name: baileys-integration
description: Use when diagnosing Baileys disconnect loops, reconnect storms, stale QR/session state, message delivery latency, auth state corruption, or when implementing WhatsApp realtime/session/webhook changes in the Baileys service layer.
---

# Baileys Integration Skill

Operate Baileys in production with explicit disconnect handling, durable auth persistence, controlled reconnect policy, and realtime-first delivery.

## When to Use

Use this skill when:

- Editing any Baileys backend file under `apps/api/src/services`, `apps/api/src`, or `apps/api/src/webhooks`
- Investigating session drops after page refresh/navigation
- Hardening reconnection strategy, socket configuration, or auth persistence
- Implementing/validating realtime delivery paths for Baileys chat events
- Running provider transition work involving Baileys compatibility

Do not use this skill for Meta Cloud API-only work or Z-API-only work.

## Mandatory References

Always load:

- `.claude/skills/baileys-integration/references/architecture.md`
- `.claude/skills/baileys-integration/references/best-practices.md`

Load on demand:

- `.claude/skills/baileys-integration/references/consolidation-roadmap.md`

## Architecture Overview (Current Repository)

### File Inventory

| File | Purpose | Layer |
| --- | --- | --- |
| `apps/api/src/services/baileys-service.ts` | Core singleton, socket lifecycle, reconnect, event emission | Service |
| `apps/api/src/services/baileys-auth-state.ts` | PostgreSQL auth state persistence (creds + keys) | Service |
| `apps/api/src/services/baileys-session-manager.ts` | Session manager and persisted-session restore | Service |
| `apps/api/src/baileys-router.ts` | tRPC procedures for connect/disconnect/status/send/messages | Router |
| `apps/api/src/webhooks/baileys-webhook.ts` | Persists Baileys events, broadcasts realtime events | Webhook |
| `apps/api/drizzle/schema-baileys.ts` | `baileys_sessions` schema and types | Schema |
| `apps/web/src/components/whatsapp/baileys-connection-card.tsx` | Baileys connection UI and QR flow | Frontend |
| `apps/web/src/hooks/use-whats-app-provider.ts` | Provider selection and shared message/conversation hooks | Frontend |

### Data Flow

```text
UI connect -> trpc.baileys.connect -> baileysSessionManager.connect()
-> baileysService.connect() -> makeWASocket()
-> connection.update / creds.update / messages.upsert
-> baileys-webhook persistence + realtime broadcast
-> frontend receives realtime events (SSE today, WS target with SSE fallback)
```

### Multi-Provider Priority (Runtime Truth)

Provider priority is:

1. `baileys`
2. `zapi`
3. `meta` (admin only)

This priority is defined in `apps/web/src/hooks/use-whats-app-provider.ts`.

## Canonical Blocks

### baileys/connection-stability

Always handle all relevant `DisconnectReason` values explicitly.

| Reason | Code | Action |
| --- | --- | --- |
| `loggedOut` | 401 | Clear session state and require re-authentication |
| `restartRequired` | 515 | Recreate socket asynchronously (`setTimeout(..., 0)`) |
| `connectionClosed` | 428 | Exponential backoff reconnect with jitter |
| `connectionLost` / `timedOut` | 408 | Exponential backoff reconnect with jitter |
| `badSession` | 500 | Clear session state and force re-authentication |
| `connectionReplaced` | 440 | Clear/recover session and force re-authentication |
| `multideviceMismatch` | 411 | Clear session state and force re-authentication |
| `forbidden` | 403 | Controlled backoff + operational alert |
| `unavailableService` | 503 | Controlled backoff + operational alert |

Rules:

- Never reconnect blindly in a tight loop.
- Track reconnect attempts and reset the counter on stable `open`.
- Do not call connect synchronously inside `connection.update`.
- Remove socket listeners before replacing socket instances.

### baileys/session-persistence

Production policy:

- Never use `useMultiFileAuthState` in production.
- Use PostgreSQL-backed auth state.
- Persist creds and keys atomically and fail loudly on unrecoverable write errors.
- Use read fallback strategy during migrations (dual-read).
- Preserve message history (`whatsapp_messages`) during session recovery.

Dual-write migration policy (progressive):

1. Write both legacy key-value session rows and snapshot JSONB representation.
2. Read snapshot first, fallback to legacy rows.
3. Cut over only after successful backfill and runtime validation.
4. Keep rollback path until post-cutover stability criteria are met.

### baileys/socket-config-optimal

Target baseline for stability/performance:

```ts
keepAliveIntervalMs: 25_000
connectTimeoutMs: 60_000
defaultQueryTimeoutMs: 60_000
retryRequestDelayMs: 250
maxMsgRetryCount: 5
markOnlineOnConnect: true
browser: Browsers.macOS("Desktop")
syncFullHistory: false
```

Notes:

- Official defaults may differ; this baseline is the project target for the Baileys stability overhaul.
- Validate changes against actual runtime behavior and reconnect telemetry before full rollout.

### baileys/reconnection-strategy

Use exponential backoff with jitter:

- `baseDelayMs = 1000`
- `multiplier = 2`
- `maxDelayMs = 30000`
- `maxAttempts = 10`
- `jitterMs = random(0..1000)`

Formula:

```text
delay = min(baseDelayMs * (multiplier ^ attempt) + jitterMs, maxDelayMs)
```

Rules:

- Reset attempts on successful and stable `open`.
- After `maxAttempts`, emit terminal failure event and require manual re-auth.
- Add reason-aware behavior (`loggedOut` and `restartRequired` are not treated as generic retries).

### baileys/disconnect-reason-persistence

**CRITICAL**: `lastDisconnectReason` must persist across session deletions.

**Problem**: When `disconnect()` is called, the session is deleted from memory. If `getSessionStatusSync()` is called afterward (e.g., when user clicks "Gerar QR Code"), it returns a status WITHOUT `lastDisconnectReason`, preventing proper reset detection.

**Solution**: Use a separate `persistentLastDisconnectReason` Map that survives session deletions:

```typescript
class BaileysService {
  // Persists lastDisconnectReason across session deletions
  private readonly persistentLastDisconnectReason = new Map<number, string>();

  // In disconnect():
  if (session.lastDisconnectReason) {
    this.persistentLastDisconnectReason.set(mentoradoId, session.lastDisconnectReason);
  }
  if (options?.clearAuth) {
    this.persistentLastDisconnectReason.delete(mentoradoId);
  }

  // In getSessionStatusSync():
  if (!session) {
    const persistedReason = this.persistentLastDisconnectReason.get(mentoradoId);
    return { ..., lastDisconnectReason: persistedReason };
  }

  // On successful connection ("open"):
  this.persistentLastDisconnectReason.delete(mentoradoId);
}
```

**Why this matters**: The `shouldResetAuthBeforeConnect` check in `baileys-router.ts` relies on `lastDisconnectReason` to decide whether to clear stale auth state before reconnecting. Without persistence, this check fails and stale auth causes reconnect loops.

### baileys/realtime-frontend

Realtime strategy:

- Primary channel: WebSocket for Baileys events.
- Fallback channel: SSE when WS is unavailable.

Event contract (target):

- `message:new`
- `connection:status`
- `connection:qr`
- `connection:error`

Compatibility rules:

- Keep existing message payload shape to avoid UI/API regressions.
- Frontend realtime reconnect is independent from Baileys socket reconnect.
- Debounce high-frequency presence/typing events to avoid UI thrash.

### baileys/health-monitoring

Operational health policy:

- Ping/pong cycle every 60s.
- Consider socket unhealthy if no pong within 5s.
- On unhealthy socket, recycle socket and enter reconnect flow.
- Track:
  - `lastMessageAt`
  - `lastConnectedAt`
  - `reconnectCount`
  - `currentStatus`
- Expose health endpoint (target): `/api/whatsapp/health`.
- Alert when reconnect count exceeds threshold in short window (for example: >3 in 5 min).

## Setup and Runtime Baseline

1. Confirm `@whiskeysockets/baileys` dependency in `package.json`.
2. Confirm `baileys_sessions` schema is present and exported.
3. Start backend with Bun and verify no startup errors.
4. Connect one mentorado at a time during first auth.
5. Confirm reconnect and message flow before enabling broader traffic.

Relevant environment variables:

| Variable | Default | Purpose |
| --- | --- | --- |
| `BAILEYS_ENABLE_LOGGING` | `false` | Toggle structured Baileys logger |
| `BAILEYS_LOG_LEVEL` | `warn`/`silent` | Controls pino verbosity |

## Troubleshooting

### QR Not Appearing

1. Verify `trpc.baileys.connect` succeeds.
2. Verify realtime channel (SSE/WS) is connected.
3. Verify there is no stale in-memory connect lock.
4. Enable temporary Baileys logging for diagnosis only.
5. Verify no competing active client replaced the session.
6. **CRITICAL**: Check CORS configuration for SSE credentials mismatch (see below).
7. **CRITICAL (UUID path)**: If using multi-connection flow, verify `createConnectionByUUID` has full DisconnectReason handlers — see below.

### SSE Not Receiving Events (QR/Status Updates)

**Root Cause Pattern**: SSE requires `withCredentials: true` for authenticated requests, but CORS wildcard (`origin: "*"`) silently disables credentials.

**Symptoms**:
- Browser console: No explicit error (silent failure)
- Network tab: SSE connection closes immediately or returns 401/403
- QR code never appears despite backend generating it
- `onStatusUpdate` callback never fires

**Diagnosis**:
1. Check backend startup logs for: `"cors_wildcard_origin"`, `"Credentials disabled"`
2. Verify container env: `docker inspect <container> --format '{{range .Config.Env}}{{println .}}{{end}}' | grep CORS`
3. Test SSE endpoint directly:
   ```bash
   curl -I -H "Origin: https://your-domain.com" https://your-domain.com/api/chat/events
   # Should return:
   # access-control-allow-credentials: true
   # access-control-allow-origin: https://your-domain.com
   ```

**Fix**:
1. Add `CORS_ORIGIN=https://your-domain.com` to `.env` file
2. Ensure `docker-compose.deploy.yml` includes `CORS_ORIGIN: ${CORS_ORIGIN}`
3. Recreate container: `docker compose -f docker-compose.deploy.yml up -d --force-recreate app`

**Code Reference** (`apps/api/src/_core/index.ts`):
```typescript
const configuredCorsOrigins = (process.env.CORS_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);
const useWildcardCors = configuredCorsOrigins.length === 0 || configuredCorsOrigins.includes("*");

app.use(
  "*",
  cors(
    useWildcardCors
      ? { origin: "*", credentials: false }  // ← Problem: credentials disabled
      : { origin: configuredCorsOrigins, credentials: true }
  )
);
```

**Prevention**:
- Never use `CORS_ORIGIN=*` in production
- Always set `CORS_ORIGIN` to the exact frontend domain
- Verify CORS headers after any deployment

### UUID Path Infinite Spinner (QR Never Appears)

**Root Cause Pattern**: The UUID multi-connection path (`createConnectionByUUID`) may have incomplete `DisconnectReason` handlers. If only `loggedOut` and `restartRequired` are handled, corrupted/stale sessions will clear auth but **never reconnect**, leaving the UI in an infinite connecting spinner.

**Symptoms**:
- UI shows "Conectando..." / spinner indefinitely
- QR code never appears even after waiting 90s
- Restarting the server or deleting+re-adding the connection fixes it temporarily
- Backend logs show `disconnect:500` (badSession) or `disconnect:411` (multideviceMismatch) with no subsequent reconnect

**Diagnosis**:
```bash
# Check backend logs for disconnect reason without reconnect
docker logs app --tail 100 | grep -E 'disconnect:|baileys\[uuid\]'
# If you see badSession/multideviceMismatch/loggedOut without 'Generating QR' after it → UUID path handler missing
```

**Fix**: Ensure `createConnectionByUUID`'s `if (connection === "close")` block handles all reasons:

```typescript
// ❌ WRONG: Only two handlers — stale sessions cause infinite spinner
if (statusCode === DisconnectReason.loggedOut) {
  this.disconnectByConnectionId(connectionId, { clearAuth: true }).catch(() => {});
  return;  // ← never reconnects! user must delete and re-add
}

// ✅ CORRECT: Full matrix + auto-reconnect after clearAuth
if (statusCode === DisconnectReason.loggedOut) {
  this.disconnectByConnectionId(connectionId, { clearAuth: true }).catch(() => {});
  setTimeout(() => {
    this.connectByConnectionId(connectionId, mentoradoId).catch(() => {});  // triggers new QR
  }, 1000);
  return;
}
// Same pattern for: badSession (500), multideviceMismatch (411)
// Plus: 428 → rate-limit backoff, 405 → connectionReplaced, 408 → timedOut,
//       503 → extended backoff, 403 → disconnect without clearAuth
```

**Reference**: `apps/api/src/services/baileys-service.ts` — legacy `createConnection` (mentoradoId path) is the correct template to replicate for the UUID path.

### Frequent Disconnects or Status Flapping

1. Inspect disconnect reason codes in logs.
2. Verify keep-alive and timeout values applied at socket creation.
3. Verify backoff counters are resetting only on stable open.
4. Check for listener leaks on socket recreation.
5. Verify no duplicate reconnect scheduler is running.

### Session Corruption Symptoms

Symptoms:

- Permanent auth failure after reconnect
- Missing/invalid key material
- Repeated `badSession` or `multideviceMismatch`

Recovery:

1. Backup affected session rows first.
2. Attempt controlled session reset through service flow.
3. Re-authenticate only affected mentorado if needed.
4. Never delete `whatsapp_messages` history.

### Messages Not Persisting

1. Verify webhook listeners are registered once.
2. Verify `content` extraction path for message type.
3. Verify insert path is writing correct `mentoradoId`.
4. Verify realtime broadcast is emitted after persistence.

### SSE QR Payload Missing connectionId (QR Delivery Latency)

**Root Cause Pattern**: When `BaileysQrEventPayload` and the SSE `status_update` broadcast omit `connectionId`, the frontend cannot optimistically update the TanStack Query cache. Instead it must wait for `invalidate()` + refetch round-trip (~200ms+ latency).

**Fix**: Propagate `connectionId` through the entire chain:

```typescript
// 1. baileys-service.ts — add connectionId to BaileysQrEventPayload interface
export interface BaileysQrEventPayload {
  connectionId?: string;  // ← add this
  qr: string;
  // ...
}

// 2. baileys-webhook.ts — include connectionId in SSE broadcast
baileysSessionManager.on("qr", ({ mentoradoId, qr, status, connected, connectionId }) => {
  sseService.broadcast(mentoradoId, "status_update", {
    status, connected, qr, connectionId, provider: "baileys",  // ← add connectionId
  });
});

// 3. use-s-s-e.ts — extend ChatSSEStatusUpdatePayload
export interface ChatSSEStatusUpdatePayload {
  connectionId?: string;  // ← add this
  qr?: string;
  // ...
}

// 4. handleStatusUpdate — optimistic cache update
if (payload.qr && payload.connectionId) {
  utils.baileys.getSessions.setData(undefined, (prev) => {
    if (!prev) return prev;
    return prev.map((conn) =>
      conn.id === payload.connectionId
        ? { ...conn, qr: payload.qr ?? undefined, status: "connecting" as const }
        : conn,
    );
  });
}
utils.baileys.getSessions.invalidate();
```

## Anti-Patterns (Do Not)

| Anti-Pattern | Why |
| --- | --- |
| Reconnect loops without capped backoff | Causes bans and instability |
| Direct filesystem auth in production | Unsafe and inconsistent in distributed runtime |
| Silent auth write failures | Corrupts session recovery |
| Deleting session rows without backup | Irreversible auth loss |
| Bypassing session manager layer | Breaks centralized lifecycle control |
| Registering duplicate socket listeners | Leads to leaks and duplicated events |
| Breaking payload contracts during realtime migration | Causes frontend regressions |
| **UUID path with partial DisconnectReason handlers** | Stale sessions clear auth but never reconnect — infinite spinner |
| **clearAuth without auto-reconnect in UUID path** | User stuck, must delete+re-add connection to get new QR |
| **SSE status_update without connectionId** | Frontend cannot target correct connection in optimistic update |

## Before Merge Checklist

- [ ] Paths and architecture references match current repo layout (`apps/...`)
- [ ] Provider priority documented as `Baileys > Z-API > Meta (admin)`
- [ ] Full disconnect reason matrix documented (401, 408, 411, 428, 440, 500, 503, 515)
- [ ] Session persistence policy includes dual-write progressive rollout
- [ ] Realtime policy documents WS-first with SSE fallback
- [ ] Health monitoring section includes ping/pong + reconnect counters
- [ ] Troubleshooting avoids destructive cleanup guidance
- [ ] `python3 .claude/skills/skill-creator/scripts/quick_validate.py .claude/skills/baileys-integration` passes

## References

- [Baileys Connecting Docs](https://baileys.wiki/docs/socket/connecting/)
- [Baileys DisconnectReason API](https://baileys.wiki/docs/api/enumerations/DisconnectReason/)
- [Baileys Defaults Source](https://raw.githubusercontent.com/WhiskeySockets/Baileys/master/src/Defaults/index.ts)
- [Architecture Map](references/architecture.md)
- [Best Practices](references/best-practices.md)
- [Consolidation Roadmap](references/consolidation-roadmap.md)
