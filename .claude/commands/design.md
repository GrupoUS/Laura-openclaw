---
description: Canonical design workflow. Phase 0 (design spec) → Phase 1 (prototype) → Phase 2 (convert) → Phase 3 (validate). frontend-specialist always runs in background.
---

# /design — Design Workflow

**ARGUMENTS**: $ARGUMENTS

> Orchestration-only. Deep policy lives in `debugger` frontend pack and `frontend-design@claude-plugins-official`.

---

## 0. ASSESS COMPLEXITY

| Complexity | Pattern            | When                         |
| ---------- | ------------------ | ---------------------------- |
| **L1-L2**  | Direct code        | Bug fix, simple tweak        |
| **L3**     | Single agent (bg)  | Component, known pattern     |
| **L4-L5**  | Multiple subagents | New feature, multi-component |
| **L6+**    | Agent Team         | Full page, complex UX        |

---

## Design Tool Chain

```
Phase 0:  explorer + Skill("ui-ux-pro-max")
            → Style, palette, fonts, layout, components (spec document)
              ↓
Phase 1:  frontend-specialist + Stitch MCP  (new pages only — skip for components)
            → mcp_stitch_generate_screen_from_text → HTML mockup
              ↓
Phase 2:  frontend-specialist + Skill("frontend-design@claude-plugins-official")  ← INVOKE FIRST
            → Deep Design Thinking + Design Commitment block
            → React components with GPUS tokens + animations
              ↓
Phase 3:  frontend-specialist (continues)
            → Maestro Auditor (5 rejection gates)
            → UX / Visual / Code quality validation
```

**Key rule:** `ui-ux-pro-max` generates the *spec* (Phase 0). `frontend-design` drives the *creative execution* (Phase 2). They never swap phases.

---

## PRE-FLIGHT: Design Research (MANDATORY — L3+)

**Before ANY implementation**, spawn `explorer` to generate a design specification using `ui-ux-pro-max`.

> **Skip only for:** Bug fixes (L1-L2) or trivial CSS tweaks.

```typescript
// Step 1: Generate design spec (foreground — must complete BEFORE implementation)
Task({
  subagent_type: "explorer",
  prompt: `Use Skill("ui-ux-pro-max") to analyze design requirements for: $ARGUMENTS

  Research and output a complete design specification:

  ## Context
  - Project: NeonDash — Mentorship Performance Dashboard
  - Theme: GPUS (Azul Petróleo + Gold) — tokens are immutable, override any palette choice
  - Stack: React 19 + Tailwind CSS 4 + shadcn/ui

  ## Required Output (structured for frontend-specialist)

  ### Style Selection
  - Choose from 67 available styles (ui-ux-pro-max catalog)
  - Anti-cliché: NO Modern SaaS, NO Bento Grid defaults, NO Glassmorphism
  - Justify why this style fits the task and user context

  ### Color Palette
  - From 96 available palettes — GPUS tokens ALWAYS override
  - Map palette to GPUS semantic tokens: --primary, --foreground, --background, etc.
  - NEVER hardcode hex values

  ### Font Pairing
  - From 57 available pairings
  - Must align with chosen style (Serif=Classic, Sans=Modern, Display=Bold)

  ### Layout Direction
  - Topology choice (avoid Standard Hero Split, 50/50 grids)
  - Proposed structure with rationale

  ### Component Inventory
  - List shadcn/ui primitives to use
  - Identify components from components/[feature]/ to reuse or extend

  ### Animation Strategy
  - Scroll-triggered entrance animations (staggered)
  - Micro-interactions for interactive elements
  - Spring physics where applicable
  - prefers-reduced-motion: mandatory

  Return a structured design spec document for handoff to frontend-specialist.`,
  // NO run_in_background — result required before spawning frontend-specialist
});
```

---

## 1. Agent Selection

| Task Type              | Agent                 | Background?   |
| ---------------------- | --------------------- | ------------- |
| Component              | frontend-specialist   | **YES**       |
| New page               | frontend-specialist   | **YES**       |
| Accessibility test     | debugger              | Yes           |
| Performance review     | performance-optimizer | Yes           |
| SEO meta               | performance-optimizer | Yes           |
| **Multi-review (L5+)** | Multiple agents       | **YES**       |

> **Rule:** `frontend-specialist` ALWAYS runs as `run_in_background: true` to preserve orchestrator memory.

---

## 2. Execution Patterns

### Pattern 1: L1-L2 — Direct (Bug Fix / Tweak)

```
Simple tweak → Fix directly (skip Phase 0 and background agent)
```

### Pattern 2: L3 — Design Research + Single Agent (Background)

```typescript
// Step 1: Design spec (foreground)
Task({
  subagent_type: "explorer",
  prompt: `Use Skill("ui-ux-pro-max") to create design spec for: [task]...`,
  // No run_in_background — need result first
});

// Step 2: Implement (background — saves orchestrator memory)
Task({
  subagent_type: "frontend-specialist",
  prompt: `Implement [task].

## Design Specification (from explorer + ui-ux-pro-max)
[paste full design spec here]

## Instructions
1. **Immediately invoke Skill("frontend-design@claude-plugins-official")** — FIRST action before any code
2. Declare your DESIGN COMMITMENT block:
   - Topological choice (FRAGMENTATION / TYPOGRAPHIC BRUTALISM / ASYMMETRIC TENSION / CONTINUOUS STREAM)
   - Cliché liquidation (which Safe Split / Glass / Glow / Bento / Blue traps are you killing?)
   - What makes this layout NOT a template?
3. Apply Phase 1 → Phase 2 → Phase 3 pipeline from /design workflow
4. GPUS tokens are immutable — override any palette choice with semantic tokens
5. Maestro Auditor: validate against 5 auto-rejection triggers before marking done
6. Run: bun run check && bun run lint:check before marking complete`,
  run_in_background: true,
});
```

### Pattern 3: L4-L5 — Design Research + Multiple Agents (Parallel)

```typescript
// Step 1: Design spec (foreground — sequential)
Task({
  subagent_type: "explorer",
  prompt: `Use Skill("ui-ux-pro-max") to create design spec for: [feature]...`,
});

// Step 2: Implementation + Reviews in PARALLEL (all background)
Task({
  subagent_type: "frontend-specialist",
  name: "design-main",
  prompt: `Design and implement [feature] using design spec: [spec]

## Instructions
1. **Invoke Skill("frontend-design@claude-plugins-official") FIRST**
2. Declare DESIGN COMMITMENT (geometry, typography, palette, effects/motion)
3. Run Deep Design Thinking: cliché scan → topological hypothesis → commit
4. GPUS tokens are immutable
5. Maestro Auditor validation before completion`,
  run_in_background: true,
});

Task({
  subagent_type: "debugger",
  name: "a11y-review",
  prompt: "Review [feature] for accessibility issues (WCAG AA minimum)",
  run_in_background: true,
});

Task({
  subagent_type: "performance-optimizer",
  name: "perf-review",
  prompt: "Review [feature] for performance issues (Core Web Vitals)",
  run_in_background: true,
});
```

### Pattern 4: L6+ — Agent Team

```typescript
// Step 1: Design spec (foreground)
Task({
  subagent_type: "explorer",
  prompt: `Use Skill("ui-ux-pro-max") to create design spec for: [feature]...`,
});

// Step 2: Agent Team for complex coordination
TeamCreate({ team_name: "design-{slug}" });

TaskCreate({ subject: "Design UI", owner: "frontend-specialist" });
TaskCreate({ subject: "Accessibility review", owner: "debugger" });
TaskCreate({ subject: "Performance review", owner: "performance-optimizer" });

TaskUpdate({ taskId: "1", owner: "frontend-specialist" });
TaskUpdate({ taskId: "2", owner: "debugger" });
TaskUpdate({ taskId: "3", owner: "performance-optimizer" });

// All tasks spawn with run_in_background: true internally
```

---

## 3. Skills to Load

```yaml
ALWAYS (in explorer step):
  - ui-ux-pro-max # 67 styles, 96 palettes, 57 font pairings — generates design spec (Phase 0)

ALWAYS (in frontend-specialist step):
  - frontend-design@claude-plugins-official # INVOKE FIRST — Phase 2 creative execution
    # Provides: Deep Design Thinking, Design Commitment format, Maestro Auditor gates
    # Contains: ux-psychology.md, typography-system.md, visual-effects.md, animation-guide.md
    # Stitch MCP tools: mcp_stitch_generate_screen_from_text, mcp_stitch_get_screen
  - debugger # Frontend pack + diagnostic gates (Phase 2-3)

OPTIONAL:
  - performance-optimization # Core Web Vitals + seo-geo-baseline pack
  - mobile-development # React Native/Flutter
```

---

## 4. 4-Phase Pipeline

### Phase 0 — Design Research (explorer + ui-ux-pro-max)

**Always:** For L3+ tasks.
**Skip:** Bug fixes, trivial tweaks.

1. Spawn `explorer` (foreground)
2. `Skill("ui-ux-pro-max")` → style + palette + fonts + layout + components
3. Wait for structured design spec
4. Pass spec to `frontend-specialist` prompt

### Phase 1 — Prototype (Stitch MCP)

**When:** New pages, landing pages
**Skip:** Components, bug fixes

1. Write prompt using GPUS Stitch Template
2. `mcp_stitch_generate_screen_from_text`
3. Review → iterate if needed
4. `mcp_stitch_get_screen` → download HTML

> **Note:** Stitch tools are accessed via `Skill("frontend-design@claude-plugins-official")` — invoke it before Phase 1 if building a new page.

### Phase 2 — Convert to React

**frontend-specialist must invoke `Skill("frontend-design@claude-plugins-official")` BEFORE writing any code.**

#### Step 1: Invoke frontend-design

```
Skill("frontend-design@claude-plugins-official")
```

This loads the creative decision framework. Then run Deep Design Thinking:

- **Context scan:** Who is the user? What emotion should this evoke?
- **Anti-cliché scan:** Am I defaulting to Bento/glass/mesh/safe splits?
- **Topological hypothesis:** Choose ONE — FRAGMENTATION / TYPOGRAPHIC BRUTALISM / ASYMMETRIC TENSION / CONTINUOUS STREAM

#### Step 2: Declare DESIGN COMMITMENT (mandatory — before first line of code)

```
🎨 DESIGN COMMITMENT: [Style Name]
- Geometry: [e.g., Sharp 0-2px radius — premium/power feel]
  Ref: typography-system.md
- Typography: [e.g., Serif headers + Sans body]
  Ref: typography-system.md
- Palette: [e.g., High-contrast Azul Petróleo + Gold → mapped to GPUS tokens]
  Ref: ux-psychology.md — GPUS tokens always override palette suggestions
- Effects/Motion: [e.g., Scroll-triggered stagger + spring on hover]
  Ref: visual-effects.md, animation-guide.md
- Layout uniqueness: [e.g., 90/10 asymmetric — NOT standard hero split]
- Cliché liquidation: [Which traps are explicitly killed in this design?]
```

> **Rule:** If you can describe the layout as "clean and minimal" without specifics, you haven't committed to a design — restart the thinking.

#### Step 3: Implement

1. Break into components (max ~150 lines)
2. Use shadcn/ui primitives
3. Map ALL colors to GPUS tokens (never hardcode hex)
4. Add tRPC queries
5. TypeScript interfaces
6. Scroll-triggered entrance animations (staggered)
7. Micro-interactions (scale/translate/opacity on hover)
8. `prefers-reduced-motion` support mandatory

### Phase 3 — Validate

#### Maestro Auditor (frontend-design auto-rejection gates)

Before marking complete, validate against ALL 5 triggers. If any are true → delete and restart:

| 🚨 Trigger           | Fail condition                                    | Fix                                              |
| :------------------- | :------------------------------------------------ | :----------------------------------------------- |
| **The "Safe Split"** | `grid-cols-2`, 50/50, 60/40, or 70/30 layouts    | Switch to 90/10, 100% stacked, or overlapping    |
| **The "Glass Trap"** | `backdrop-blur` without solid raw borders         | Remove blur → solid colors + raw 1-2px borders   |
| **The "Glow Trap"**  | Soft gradients to make elements "pop"             | High-contrast solid colors or grain textures     |
| **The "Bento Trap"** | Safe rounded grid boxes organizing content        | Fragment the grid, break alignment intentionally |
| **The "Blue Trap"**  | Default blue/teal as primary color                | Acid green, signal orange, deep red, or GPUS tokens |

**Template test (brutal honesty):**
- "Could this be a Vercel/Stripe template?" → YES = FAIL
- "Would I scroll past this on Dribbble?" → YES = FAIL

#### UX Quality

- [ ] Loading states (skeletons)
- [ ] Error states
- [ ] Empty states
- [ ] Keyboard navigation
- [ ] Focus visible
- [ ] Touch targets ≥ 44px

#### Visual Quality

- [ ] GPUS tokens only (no hardcoded hex)
- [ ] Dark mode tested
- [ ] Responsive breakpoints

#### Code Quality

- [ ] shadcn/ui primitives
- [ ] No barrel imports
- [ ] `bun run check`
- [ ] `bun run lint:check`

---

## 5. Decision Tree

```
START: /design [task]

├─► Is it a BUG FIX or trivial tweak?
│     └─► YES → Direct fix (skip Phase 0, no background agent)
│
├─► Phase 0: ALWAYS (L3+)
│     └─► explorer + Skill("ui-ux-pro-max") → design spec
│
├─► Is it a COMPONENT or PAGE?
│     └─► YES → frontend-specialist (run_in_background: true)
│                 → Invoke Skill("frontend-design") FIRST
│                 → Declare DESIGN COMMITMENT
│                 → Phase 1? (page=yes, component=skip) → Phase 2 → Phase 3
│
├─► Does it need DESIGN PROTOTYPE?
│     ├─► YES → Phase 1 (Stitch) → Phase 2 → Phase 3 (all in background agent)
│     └─► NO  → Phase 2 → Phase 3 (in background agent)
│
├─► Need MULTIPLE REVIEWS?
│     ├─► YES → Parallel agents (all run_in_background: true)
│     └─► NO  → Single frontend-specialist (run_in_background: true)
│
└─► Is it L6+ (complex)?
      └─► YES → Agent Team (after Phase 0 design spec)
```

---

## Anti-Patterns

| ❌ Don't                                        | ✅ Do                                                      |
| ----------------------------------------------- | ---------------------------------------------------------- |
| Skip Phase 0 for L3+ tasks                     | Always run explorer + ui-ux-pro-max first            |
| Run frontend-specialist in foreground           | Always use run_in_background: true                         |
| Skip Skill("frontend-design") invocation        | Invoke frontend-design FIRST in frontend-specialist        |
| Write code before declaring DESIGN COMMITMENT   | Declare geometry/typography/palette/effects before coding  |
| Use ui-ux-pro-max inside frontend-specialist    | ui-ux-pro-max belongs to explorer (Phase 0 only)     |
| Use frontend-design inside explorer       | frontend-design belongs to frontend-specialist (Phase 2)   |
| Hardcode colors                                 | Use GPUS tokens                                            |
| Custom modal                                    | shadcn/ui Dialog                                           |
| Skip UX validation                              | Loading/error/empty first                                  |
| Skip Maestro Auditor                            | Validate 5 rejection triggers before marking done          |
| Nested ScrollArea                               | Single at layout level                                     |
| Components in `ui/`                             | `components/[feature]/`                                    |

---

## References

- `.claude/skills/ui-ux-pro-max/SKILL.md` — 67 styles, 96 palettes, 57 font pairings (Phase 0)
- `.claude/skills/debugger/SKILL.md` — Frontend pack standards and gates
- `frontend-design@claude-plugins-official` — Creative design + Maestro Auditor + Stitch MCP (Phase 2)
- `.claude/skills/planning/SKILL.md` — Agent patterns
