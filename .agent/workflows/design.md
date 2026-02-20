---
description: Canonical design workflow. 3-phase pipeline: Prototype → Convert → Validate. Routes UI/UX implementation based on complexity.
---

/design — Design Workflow

$ARGUMENTS

> **Authority:** Deep policy lives in `~/.gemini/antigravity/skills/frontend-rules/SKILL.md` and `~/.gemini/antigravity/skills/ui-ux-pro-max/SKILL.md`.

---

## 0. Mandatory First Steps

1. **Read root `AGENTS.md`** — Always, before any action
2. **Load relevant skills** — `view_file` on each applicable `SKILL.md`
   - `frontend-rules` (Code standards + React)
   - `frontend-design` or `ui-ux-pro-max` (Aesthetics + Creative design)
   - `gpus-theme` (If working on GPUS components)
3. **Read subdirectory `AGENTS.md`** — Only for directories you will edit

---

## 1. Quick Assessment (Complexity)

| Complexity | Pattern | When | Action |
|------------|---------|------|--------|
| **L1-L2** | Direct code | Bug fix, simple tweak | Implement direct fix using direct tool calls |
| **L3** | Single component | Known pattern, isolated | Execute Phase 2 → 3 |
| **L4-L5** | Complex feature | New page, multi-component | Execute Phase 1 → 2 → 3 |
| **L6+** | Full layout | Entire page, complex UX | Run `/plan` first, then design pipeline |

---

## 2. 3-Phase Design Pipeline

### Phase 1 — Prototype (Stitch MCP)

**When:** New pages, landing pages, major templates
**Skip:** Minor components, direct bug fixes

1. **Draft Prompt:** Write a detailed prompt utilizing the GPUS Stitch Template and design tokens.
2. **Generate Prototype:** Call `mcp_stitch_generate_screen_from_text`.
3. **Internal Review:** Iterate on the design until the aesthetic wows the user.
4. **Extract Asset:** Call `mcp_stitch_get_screen` to download the HTML/design code.

### Phase 2 — Convert to React

1. **Decompose:** Break the generated prototype into atomic React components (max ~150 lines).
2. **Apply Primitives:** Replace raw HTML elements with `shadcn/ui` primitives (Dialog, Button, Input, etc.).
3. **Token Mapping:** Convert raw colors/spacing to GPUS/Tailwind v4 tokens (from `frontend-rules`).
4. **Integration:** Add tRPC queries and Drizzle types if data is required.
5. **Types:** Ensure strict TypeScript interfaces for all components.

### Phase 3 — Validate (Quality Gates)

**UX Quality:**
- [ ] Loading states (skeletons/spinners)
- [ ] Error states handled gracefully
- [ ] Empty states explicitly defined
- [ ] Keyboard navigation and accessibility
- [ ] Focus visible state implemented
- [ ] Touch targets ≥ 44px for mobile

**Visual Quality:**
- [ ] GPUS/Design tokens ONLY (no hardcoded hex values)
- [ ] Dark mode explicitly tested
- [ ] Responsive breakpoints checked (mobile, tablet, desktop)

**Code Quality:**
- [ ] Exclusively uses `shadcn/ui` primitives for standard UI
- [ ] Feature components in `components/[feature]/`, never in `components/ui/`
- [ ] No barrel imports (`index.ts` re-exports)

**Verification Execution:**
```bash
bun run check
bun run lint:check
```

---

## 3. Tool & Skill Routing

Execute `view_file` on these to understand context during tasks:

```yaml
ALWAYS:
  - ~/.gemini/antigravity/skills/frontend-rules/SKILL.md
  - ~/.gemini/antigravity/skills/ui-ux-pro-max/SKILL.md

OPTIONAL:
  - ~/.gemini/antigravity/skills/webapp-testing/SKILL.md     # React testing, DOM validation
  - ~/.gemini/antigravity/skills/performance-optimization/SKILL.md # Core Web Vitals
  - ~/.gemini/antigravity/skills/seo-optimization/SKILL.md    # Metadata, structured data
  - ~/.gemini/antigravity/skills/mobile-development/SKILL.md  # React Native / Flutter
```

---

## 4. Anti-Patterns

| ❌ Don't | ✅ Do |
|----------|------|
| Hardcode raw hex colors | Use theme tokens (`text-primary`, `bg-muted`) |
| Build custom overlay logic | Use `shadcn/ui` Dialog, Popover, or Sheet |
| Skip loading states | Implement Skeleton loaders upfront |
| Use heavy CSS if Tailwind works | Use standard Tailwind v4 utility classes |
| Use arbitrary subagents | Execute tool calls iteratively and load skills |
| Guess accessibility | Use semantic HTML and verify with tools |

---

## 5. References

- **AGENTS.md** — Project rules and standards
- **Planning:** `/plan` workflow (`~/.gemini/antigravity/workflows/plan.md`)
- **Frontend Debug:** `/frontend-debug` workflow (`~/.gemini/antigravity/workflows/frontend-debug.md`)
- **Skills Directory:** `~/.gemini/antigravity/skills/`