# components/ — React Component Rules

> **Parent**: [`dashboard/AGENTS.md`](../AGENTS.md) · **Scope**: `components/` directory

---

## Folder Organization

| Folder        | Purpose                              | Pattern               |
| ------------- | ------------------------------------ | --------------------- |
| `ui/`         | shadcn/ui primitives (Radix-based)   | Generic, no biz logic |
| `board/`      | Kanban board (KanbanBoard, Column, TaskCard) | dnd-kit DnD    |
| `agents/`     | Agent monitoring (AgentCard, ActivityFeed, AgentsGrid) | SSE live data |
| `analytics/`  | Charts (KPIs, donut, timeline, velocity, phase progress) | Recharts |
| `create/`     | Task creation (CreateTaskSheet, PlanPreview) | Sheet/dialog   |
| `list/`       | Table views (TaskList, TaskRow, PhaseGroup)  | Sortable lists |
| `shared/`     | Cross-feature (AgentBadge, PriorityBadge, SubtaskProgress, ConnectionStatus) | Reusable atoms |
| `layout/`     | App shell (Sidebar, ViewHeader)      | Navigation/chrome     |

---

## Rules

### `ui/` — shadcn/ui Only

> [!CAUTION]
> `ui/` is **exclusively** for shadcn/ui primitives installed via `npx shadcn@latest add`.
> Never place custom components here. Never modify generated code beyond `cn()` customization.

Current primitives: `badge`, `button`, `progress`, `scroll-area`, `select`, `sheet`, `textarea`, `tooltip`

### Component Architecture

1. **`'use client'`** — Add only when using hooks, event handlers, or browser APIs
2. **Props typing** — Always define a `Props` interface or use inline TypeScript
3. **No business logic** — Components render UI; logic lives in `hooks/` or `lib/`
4. **Composition > Inheritance** — Use children/render props, never extend components
5. **Naming** — PascalCase files matching the default export: `TaskCard.tsx` → `export default function TaskCard()`

### Styling

- Use **Tailwind CSS v4** utility classes exclusively
- Use `cn()` from `lib/utils` for conditional classes
- Never use inline `style={}` unless for dynamic values (chart dimensions)
- Color tokens from `tailwind.config.ts` — never hardcode hex values

### Icons

- Import from `lucide-react` only
- Always specify `size` and use `className` for color
- Prefer semantic icon names that describe the action, not the shape

### Charts (Recharts)

- Keep chart config separate from component rendering
- Use responsive container wrappers
- Format tooltips and labels for readability
- Match colors to Tailwind design tokens

### Drag & Drop (dnd-kit)

- `KanbanBoard` uses `DndContext` with collision detection
- `KanbanColumn` uses `useDroppable`
- `TaskCard` uses `useDraggable`
- Always handle `onDragEnd` with optimistic updates + API sync
