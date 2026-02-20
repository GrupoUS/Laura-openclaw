# Find Skills

Skill discovery protocol using the official Skills CLI (`npx skills`).

## Purpose
Use this skill when you need a capability that is not currently available in your `available_skills`. Instead of trying to invent a solution or failing, search the community ecosystem for a ready-made skill.

## Usage
### Search for a skill
```bash
npx skills find "<query>"
```
Example: `npx skills find "linear"` or `npx skills find "pdf"`

### Install a skill
If a suitable skill is found (e.g., `owner/repo@skill`), install it:
```bash
npx skills add <skill-id> --path skills/
```
Example: `npx skills add vercel-labs/agent-skills@vercel-react-best-practices --path skills/`

After installation, the new skill will be available in your next turn (OpenClaw reloads skills).

## When to Use
1. User asks for a task you don't know how to do.
2. You need an integration (Linear, Stripe, AWS, etc.) that isn't configured.
3. You want to learn a best practice or workflow.

## Source
Based on: https://skills.sh/vercel-labs/skills/find-skills
