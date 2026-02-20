# Agent Loop & Tools

## The Core Loop
An agentic loop is the full workflow:
1. Intake (message received).
2. Context assembly (system prompts, skills injected).
3. Inference (model streams).
4. Tool execution.
5. Persistence (session state committed).

## Hook Systems
- **Internal Gateway Hooks**: Event-driven scripts for commands/lifecycle (`agent:bootstrap`, `/new`, `/reset`).
- **Plugin Hooks**: Run inside the pipeline. `before_agent_start`, `agent_end`, `message_sent`, etc.

## The Tools
The gateway provides core tools:
- `exec`, `bash`, `process` (Host shell/Runtime execution)
- `browser` (Managed headless Chrome profile)
- `canvas` (A2UI render interface)
- `nodes` (macOS/iOS paired companions for screen recording, location)
- `message` (Routing to WhatsApp/Telegram)
- `cron` (Add scheduled cron jobs for recurrent tasks)
- `gateway` (Apply/Patch openclaw.json and restart)

## Heartbeat vs Cron Jobs
**Use Heartbeat When**:
- You need batch checks (inbox, calendar, weather).
- Conversation context is required.
- You can drift (30m accuracy vs strict start).

**Use Cron When**:
- Exact scheduling is required.
- Tasks need isolation from the main session loop.
- One-shot reminders or actions that do not require past message tracking.

Do NOT spam `HEARTBEAT_OK` just because you woke up. Send a silent update to `memory/heartbeat-state.json` or nothing at all unless action is needed.
