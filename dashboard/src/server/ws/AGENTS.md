# ws/ — WebSocket Gateway Client Rules

> **Parent**: [`server/AGENTS.md`](../AGENTS.md) · **Scope**: `src/server/ws/`

---

## Files

| File           | Purpose                                     |
| -------------- | ------------------------------------------- |
| `openclaw.ts`  | WebSocket client to OpenClaw gateway        |

---

## Architecture

The WebSocket client connects to the OpenClaw gateway to:
- Send commands to agents
- Receive real-time agent events
- Monitor agent status and health

## Rules

### Connection Management

1. **Auto-reconnection** — implement exponential backoff on disconnect
2. **Heartbeat** — send periodic pings to detect dead connections
3. **Singleton** — one WebSocket connection per server instance
4. **Graceful shutdown** — close connection on process `SIGTERM`/`SIGINT`

### Authentication

- Auth via `OPENCLAW_GATEWAY_TOKEN` in the initial handshake
- Token sent as query parameter or in first message
- Handle auth rejection gracefully (log + retry with backoff)

### Message Protocol

```typescript
// Outgoing: command to gateway
{ type: "command", target: "agent-id", action: "...", payload: {...} }

// Incoming: event from gateway
{ type: "event", source: "agent-id", event: "...", data: {...} }
```

### Error Handling

- Log all connection errors with timestamp
- Never crash the server on WebSocket errors — isolate failures
- Buffer commands during disconnection, replay on reconnect (if idempotent)
- Distinguish between transient errors (retry) and permanent errors (alert)

### Performance

- Avoid processing heavy payloads on the main thread
- Parse messages lazily — only parse what you need
- Rate-limit outgoing commands to prevent gateway overload
