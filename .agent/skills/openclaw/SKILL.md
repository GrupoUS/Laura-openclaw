---
name: optimizing-openclaw
description: Use when configuring the OpenClaw Gateway, setting up WhatsApp channels, writing AGENTS.md templates, debugging the Agent Loop, or managing OpenClaw tools and sessions.
---

# Optimizing OpenClaw

## Overview

Use this standard to configure, troubleshoot, and optimize OpenClaw instances. OpenClaw is a self-hosted gateway connecting multiple chat channels (WhatsApp, Discord, Telegram, etc.) to coding agents.

## When to Use

- Initializing or fixing OpenClaw installations.
- Setting up the WhatsApp Web Channel (Baileys).
- Writing or updating `AGENTS.md` templates and memory systems.
- Troubleshooting the Agentic Loop or tool configurations.
- Configuring Remote Access or Node pair connections (WebSocket/REST).

## Core Rules

1. **Gateways & Nodes**: Exactly ONE Gateway process per host controls all channels and agent instances. Nodes connect via WebSocket to the Gateway.
2. **Environment & Runtimes**: ALWAYS run the Gateway using Node.js for WhatsApp/Telegram stability. Bun is NOT recommended for the gateway runtime due to bugs.
3. **WhatsApp Connections**: Never use Twilio or virtual numbers (TextNow, Google Voice). Always use a dedicated real number (e.g. eSIM) to avoid Meta blocking.
4. **Agent File Structure**: Do not use "mental notes". The agent relies on `.md` files (`AGENTS.md`, `MEMORY.md`, `memory/YYYY-MM-DD.md`) across sessions to build state. Always write down decisions to these files.

## Quick Reference

- **Install**: `npm install -g openclaw@latest`
- **Update**: `openclaw update` (or `npm i -g openclaw@latest` → `openclaw doctor` → `openclaw gateway restart`)
- **Fix Configs**: Always run `openclaw doctor` after an update or config change.
- **Config Path**: `~/.openclaw/openclaw.json`
- **Link WhatsApp**: `openclaw channels login`
- **Logs**: `openclaw logs --follow` or `/tmp/openclaw/openclaw-YYYY-MM-DD.log`

## Detailed Implementation References

Load these files as needed for specific deep dives:

- [Gateway Architecture](file:///Users/mauricio/.gemini/antigravity/skills/optimizing-openclaw/references/openclaw-architecture.md)
- [WhatsApp Best Practices](file:///Users/mauricio/.gemini/antigravity/skills/optimizing-openclaw/references/whatsapp-best-practices.md)
- [Agent Loop & Tools](file:///Users/mauricio/.gemini/antigravity/skills/optimizing-openclaw/references/agent-loop-and-tools.md)
- [AGENTS.md Framework](file:///Users/mauricio/.gemini/antigravity/skills/optimizing-openclaw/references/agents-template.md)
- [Directory Architecture](file:///Users/mauricio/.gemini/antigravity/skills/optimizing-openclaw/references/directory-architecture.md)

## Common Mistakes

- **Running with Bun**: Leads to unreliable WebSockets for WhatsApp/Telegram.
- **Twilio for Assistant**: Meta's 24h business reply window enforces restrictive policies, blocking high-volume assistant chats.
- **Mental Notes in the Loop**: The agent will forget them. Update `MEMORY.md` immediately.
- **Too many heartbeats**: If nothing happened, reply with `HEARTBEAT_OK` rather than filling the chat with noise. Use Cron jobs for exact timings, Heartbeats for batchable tasks.
