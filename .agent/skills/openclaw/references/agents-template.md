# AGENTS.md Framework

## Structure Requirements
When developing an OpenClaw instance context, always maintain documentation:
1. `SOUL.md`: Base agent persona.
2. `USER.md`: Demographic/Context of the humans involved.
3. `AGENTS.md`: Instruction manual for the session.

## Memory Strategy
- The agent wakes up "amnesic" beside its memory files.
- `memory/YYYY-MM-DD.md` (Today + Yesterday): Raw event logs.
- `MEMORY.md`: Curated long-term decisions and distilled intelligence.

**Crucial Rules**:
- ONLY load `MEMORY.md` in MAIN sessions (isolated 1-on-1 direct chats).
- Do NOT load it in group chats or shared contexts. It leaks personal info.
- **NO MENTAL NOTES**. The agent must persist thoughts it wants to recall to the physical file system directly; memory boundaries do not survive session exits.

## Groups and Modularity
- In group chats, **do not respond to every message**. Be selective.
- Silence means contributing only when explicitly mentioned or directly valuable.
- React with emojis natively. One reaction maximum.

## Tool Loading
All specific custom tool instructions belong in `SKILL.md` boundaries or `TOOLS.md`. Do not pollute `AGENTS.md` with multi-page API specs.
