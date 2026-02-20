---
name: frontend-rules
description: Use when designing components, building layouts, prototyping with Stitch MCP, reviewing UI code quality, checking accessibility, fixing scroll/overflow issues, applying GPUS design tokens, troubleshooting shadcn/ui integration, when hardcoded hex colors appear in code, when layout breaks on resize, when dark mode looks wrong, when components are created in ui/ folder that aren't shadcn primitives, or when React performance issues emerge from re-renders.
---

# Frontend Rules Skill

> **Philosophy:** UX > UI. Intentional Minimalism. Every element must earn its place.

---

## When to Use

### Trigger Symptoms (Use this skill when...)

- Creating or modifying React components in `apps/web/src/components/`
- Using Stitch MCP to prototype UI
- Seeing hardcoded hex colors (`bg-[#xxx]`, `text-[#xxx]`)
- Layout breaks on window resize or mobile
- Dark mode styling looks incorrect
- Scroll behavior is broken (content clipped or double-scroll)
- Component placed in `ui/` that isn't a shadcn primitive
- Performance issues from unnecessary re-renders

### When NOT to Use

- Backend/API work → use `backend-design` skill
- Database schema changes → use `clerk-neon-auth` skill
- Docker/deployment → use `docker-deploy` skill
- Pure CSS/Styling without React components

---

## Core Rules (Non-Negotiable)

### Rule 1: Semantic Tokens Only

```tsx
// ❌ NEVER hardcode hex
<div className="bg-[#0f4c75] text-[#fbbf24]">

// ✅ ALWAYS use semantic tokens
<div className="bg-primary text-foreground">
```

**No exceptions:** Even "one-off" colors become maintenance debt. Every time.

### Rule 2: Scroll Owner Chain

```
DashboardLayout → ScrollArea (single owner) → PageContainer → Content
```

| Rule                                     | Enforcement                         |
| ---------------------------------------- | ----------------------------------- |
| Only `ScrollArea` owns vertical scroll   | Never add `overflow-auto` elsewhere |
| No `overflow-hidden` on content wrappers | Breaks content flow                 |
| Height by content, not fixed             | Never `h-screen` on inner elements  |

### Rule 3: Component Placement

| Location                | What Goes Here                                |
| ----------------------- | --------------------------------------------- |
| `components/ui/`        | **ONLY** shadcn/ui primitives (86 components) |
| `components/[feature]/` | All feature-specific components               |

**Never** create custom components in `ui/`. Every time someone does, it breaks the shadcn update path.

---

## Tech Stack

| Layer       | Technology            | Notes                              |
| ----------- | --------------------- | ---------------------------------- |
| Framework   | React 19 + Vite 7     | Function components, `ref` as prop |
| Styling     | Tailwind CSS v4       | `@tailwindcss/vite` plugin         |
| Components  | shadcn/ui + Radix     | Never reinvent primitives          |
| Animation   | Framer Motion 12      | Micro-interactions                 |
| Charts      | Recharts 2            | Performance visualizations         |
| Prototyping | Stitch MCP            | AI-powered UI generation           |
| Data        | tRPC + Tanstack Query | Type-safe API layer                |

---

## GPUS Design System (Quick Reference)

> **Identity:** Azul Petróleo + Gold accents. Professional, premium, educational.
> Full tokens: `references/project-design-system.md` · Theme: `gpus-theme/SKILL.md`

### Essential Palette

| Token          | Light                  | Dark                   | Use For              |
| -------------- | ---------------------- | ---------------------- | -------------------- |
| `--primary`    | Gold `38 60% 45%`      | Amber `43 96% 56%`     | Buttons, links, CTAs |
| `--background` | Slate 50 `210 40% 98%` | Slate 950 `222 47% 6%` | Page background      |
| `--foreground` | Petróleo `203 65% 26%` | Slate 50 `210 40% 98%` | Body text            |
| `--ring`       | Gold                   | Gold                   | Focus indicators     |

### Brand Utilities

| Class                | Purpose                  |
| -------------------- | ------------------------ |
| `text-neon-petroleo` | Azul Petróleo brand text |
| `text-neon-gold`     | Gold brand elements      |
| `bg-neon-gold`       | Gold backgrounds         |
| `border-neon-border` | Standard brand border    |

---

## Stitch MCP Pipeline

```
1. stitch_list_projects → select project
2. stitch_list_screens → review or generate new
3. stitch_generate_screen_from_text → with GPUS template
4. stitch_get_screen → fetch details
5. Convert to React with shadcn + GPUS tokens
```

> Full reference: `references/stitch-mcp-usage.md`

### GPUS Prompt Template

```markdown
A professional [PAGE_TYPE] for a mentorship platform.
**DESIGN SYSTEM (GPUS):**

- Background: Deep Navy (#0a0f1c) / Dark Surface (#111827)
- Primary: Electric Gold (#f5a623)
- Text: Off-White (#f9fafb) headings, Cool Gray (#9ca3af) labels
- Font: Manrope
- Radius: 8px
```

### Stitch → React Conversion

| Stitch Output        | Neondash Equivalent                        |
| -------------------- | ------------------------------------------ |
| `<button>`           | `<Button variant="default">` from shadcn   |
| `<div class="card">` | `<Card><CardContent>` from shadcn          |
| `<input>`            | `<Input>` from shadcn + react-hook-form    |
| Arbitrary colors     | GPUS CSS variables (`hsl(var(--primary))`) |

---

## Common Mistakes → Fixes

| Mistake                       | Why It's Wrong                   | Fix                              |
| ----------------------------- | -------------------------------- | -------------------------------- |
| `bg-[#0f4c75]`                | Breaks theming, maintenance debt | `text-neon-petroleo`             |
| `overflow-hidden` on wrapper  | Clips content unexpectedly       | Let ScrollArea handle overflow   |
| Component in `ui/`            | Breaks shadcn updates            | Move to `components/[feature]/`  |
| `useEffect` for derived state | Unnecessary re-renders           | Compute in render with `useMemo` |
| Sequential `await` calls      | Waterfall latency                | `Promise.all([a, b])`            |

---

## Rationalization Table

| Excuse                                     | Reality                                             |
| ------------------------------------------ | --------------------------------------------------- |
| "Just this one hex color"                  | One becomes ten. Semantic tokens from day one.      |
| "ScrollArea is overkill"                   | Manual scroll management always breaks. Every time. |
| "This is a generic component, goes in ui/" | If not shadcn primitive, it's feature code.         |
| "I'll add dark mode later"                 | Later = never. Test both modes immediately.         |
| "This component is too simple for shadcn"  | Simple code breaks. shadcn exists for consistency.  |

---

## Pre-Delivery Checklist

**Copy and track during implementation:**

```markdown
## Frontend Quality Checklist

- [ ] Loading states (skeletons/spinners)
- [ ] Error states handled
- [ ] Empty states designed
- [ ] Keyboard navigation works
- [ ] Focus visible on all interactive elements
- [ ] `prefers-reduced-motion` respected
- [ ] GPUS semantic tokens only (no hardcoded hex)
- [ ] Dark mode works (both themes tested)
- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile
- [ ] shadcn/ui primitives used (no custom buttons/modals)
- [ ] Feature components in `components/[feature]/`
- [ ] TypeScript strict — no `any`
```

---

## Red Flags — STOP and Fix

| Red Flag                                 | Action                      |
| ---------------------------------------- | --------------------------- |
| Code contains hex color (`#[a-f0-9]{6}`) | Replace with semantic token |
| Component file in `ui/` not from shadcn  | Move to feature folder      |
| `overflow-hidden` on non-root element    | Remove, use ScrollArea      |
| `useEffect` setting state from props     | Use `useMemo` instead       |
| Sequential awaits in same function       | Use `Promise.all`           |

---

## References

| File                                                            | Purpose                                   |
| --------------------------------------------------------------- | ----------------------------------------- |
| [project-design-system.md](references/project-design-system.md) | Full GPUS tokens, component architecture  |
| [react-best-practices.md](references/react-best-practices.md)   | React 19 + tRPC performance rules         |
| [web-design-standards.md](references/web-design-standards.md)   | Web Interface Guidelines + anti-patterns  |
| [shadcn-patterns.md](references/shadcn-patterns.md)             | Deep shadcn/ui patterns, troubleshooting  |
| [stitch-mcp-usage.md](references/stitch-mcp-usage.md)           | Stitch MCP setup, tools, conversion guide |
