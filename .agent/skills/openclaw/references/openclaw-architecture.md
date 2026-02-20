# Gateway Architecture

## The Gateway Daemon
- A single long-lived **Gateway** owns all messaging surfaces.
- It acts as an orchestrator for WebSockets, WebChat, and REST APIs.
- One Gateway per host; it is the only place that opens a WhatsApp/Telegram session.
- Exposes typed WS API (events: `agent`, `chat`, `presence`, `health`, `heartbeat`, `cron`).

## Connections
- **Clients** (Mac App, CLI, Web UI) connect over WebSocket (default `127.0.0.1:18789`).
- **Nodes** (macOS/iOS/Android headless) connect to the same WS server but declare `role: node`.
- Pairing is device-based; approval lives in the device pairing store (`openclaw pairing approve <system>`).
- Local connects (loopback, tailnet) can be auto-approved. Non-local requires explicit approval.

## Storage
- Config: `~/.openclaw/openclaw.json`
- Credentials: `~/.openclaw/credentials/`
- Workspace: `~/.openclaw/workspace`

## Updates
- Use `openclaw update` (source) or `npm i -g openclaw@latest` (global).
- **ALWAYS use `openclaw doctor`** immediately following any update or configuration change before restarting the Gateway.
