# shadcn/ui Patterns

> Deep reference for shadcn/ui component integration in the neondash project.
> For quick reference, see the shadcn/ui section in `SKILL.md`.
> Source: [shadcn/ui llms.txt](https://ui.shadcn.com/llms.txt)

---

## Core Philosophy

shadcn/ui is a **collection of beautifully-designed, accessible components** and a **code distribution platform**. Components live in **your codebase**, not `node_modules`.

| Principle | Description |
|-----------|-------------|
| **Open Code** | Full ownership — modify anything freely |
| **Composition** | Build complex UI from simple primitives |
| **Distribution** | Registry system to publish and share code |
| **Beautiful Defaults** | Production-ready design out of the box |
| **AI-Ready** | MCP server + LLM-friendly documentation |
| **No version lock-in** | Update components selectively |
| **Zero runtime overhead** | Just the code you need |

Built with **TypeScript**, **Tailwind CSS**, and **Radix UI** primitives. Supports multiple frameworks: Next.js, Vite, Remix, Astro, React Router, TanStack Router, and more.

---

## Project Setup

### Neondash Configuration

Our project uses shadcn/ui with:
- **Tailwind CSS v4** (`@tailwindcss/vite`) — [Setup Guide](https://ui.shadcn.com/docs/tailwind-v4)
- **Vite** framework — [Install Guide](https://ui.shadcn.com/docs/installation/vite)
- **Radix UI** primitives
- **TypeScript strict mode**
- **Bun** as package manager

```bash
# Add a component
bunx shadcn@latest add [component-name]

# Add multiple components
bunx shadcn@latest add button card dialog input

# Configuration file
# See: https://ui.shadcn.com/docs/components-json
```

### File Structure

```
apps/web/src/
├── components/
│   ├── ui/            # shadcn components (owned, not node_modules)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   └── [feature]/     # composed business components
│       └── user-card.tsx
├── lib/
│   └── utils.ts       # cn() utility
└── app.css            # CSS variables for theming
```

### The `cn()` Utility

All shadcn components use `cn()` for intelligent class merging:

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## Component Catalog

> Complete index organized by category. Links point to official docs.

### Form & Input

| Component | Description | Docs |
|-----------|-------------|------|
| **Form** | Build forms with React Hook Form + Zod | [docs](https://ui.shadcn.com/docs/components/form) |
| **Field** | Form input with labels and error messages | [docs](https://ui.shadcn.com/docs/components/field) |
| **Button** | Multiple variants (default, destructive, outline, secondary, ghost, link) | [docs](https://ui.shadcn.com/docs/components/button) |
| **Button Group** | Group multiple buttons together | [docs](https://ui.shadcn.com/docs/components/button-group) |
| **Input** | Text input | [docs](https://ui.shadcn.com/docs/components/input) |
| **Input Group** | Input with prefix/suffix addons | [docs](https://ui.shadcn.com/docs/components/input-group) |
| **Input OTP** | One-time password input | [docs](https://ui.shadcn.com/docs/components/input-otp) |
| **Textarea** | Multi-line text input | [docs](https://ui.shadcn.com/docs/components/textarea) |
| **Checkbox** | Checkbox input | [docs](https://ui.shadcn.com/docs/components/checkbox) |
| **Radio Group** | Radio button group | [docs](https://ui.shadcn.com/docs/components/radio-group) |
| **Select** | Select dropdown | [docs](https://ui.shadcn.com/docs/components/select) |
| **Combobox** | Searchable select with autocomplete | [docs](https://ui.shadcn.com/docs/components/combobox) |
| **Switch** | Toggle switch | [docs](https://ui.shadcn.com/docs/components/switch) |
| **Slider** | Slider input | [docs](https://ui.shadcn.com/docs/components/slider) |
| **Calendar** | Date selection calendar | [docs](https://ui.shadcn.com/docs/components/calendar) |
| **Date Picker** | Input + calendar combined | [docs](https://ui.shadcn.com/docs/components/date-picker) |
| **Label** | Form label | [docs](https://ui.shadcn.com/docs/components/label) |

### Layout & Navigation

| Component | Description | Docs |
|-----------|-------------|------|
| **Accordion** | Collapsible sections | [docs](https://ui.shadcn.com/docs/components/accordion) |
| **Breadcrumb** | Breadcrumb navigation | [docs](https://ui.shadcn.com/docs/components/breadcrumb) |
| **Navigation Menu** | Accessible nav with dropdowns | [docs](https://ui.shadcn.com/docs/components/navigation-menu) |
| **Sidebar** | Collapsible app sidebar | [docs](https://ui.shadcn.com/docs/components/sidebar) |
| **Tabs** | Tabbed interface | [docs](https://ui.shadcn.com/docs/components/tabs) |
| **Separator** | Visual divider | [docs](https://ui.shadcn.com/docs/components/separator) |
| **Scroll Area** | Custom scrollable area | [docs](https://ui.shadcn.com/docs/components/scroll-area) |
| **Resizable** | Resizable panel layout | [docs](https://ui.shadcn.com/docs/components/resizable) |

### Overlays & Dialogs

| Component | Description | Docs |
|-----------|-------------|------|
| **Dialog** | Modal dialog | [docs](https://ui.shadcn.com/docs/components/dialog) |
| **Alert Dialog** | Confirmation prompts | [docs](https://ui.shadcn.com/docs/components/alert-dialog) |
| **Sheet** | Slide-out panel (drawer) | [docs](https://ui.shadcn.com/docs/components/sheet) |
| **Drawer** | Mobile-friendly drawer (Vaul) | [docs](https://ui.shadcn.com/docs/components/drawer) |
| **Popover** | Floating popover | [docs](https://ui.shadcn.com/docs/components/popover) |
| **Tooltip** | Additional context on hover | [docs](https://ui.shadcn.com/docs/components/tooltip) |
| **Hover Card** | Card that appears on hover | [docs](https://ui.shadcn.com/docs/components/hover-card) |
| **Context Menu** | Right-click menu | [docs](https://ui.shadcn.com/docs/components/context-menu) |
| **Dropdown Menu** | Dropdown menu | [docs](https://ui.shadcn.com/docs/components/dropdown-menu) |
| **Menubar** | Horizontal menubar | [docs](https://ui.shadcn.com/docs/components/menubar) |
| **Command** | Command palette (cmdk) | [docs](https://ui.shadcn.com/docs/components/command) |

### Feedback & Status

| Component | Description | Docs |
|-----------|-------------|------|
| **Alert** | Messages and notifications | [docs](https://ui.shadcn.com/docs/components/alert) |
| **Toast** | Toast notifications (Sonner) | [docs](https://ui.shadcn.com/docs/components/toast) |
| **Progress** | Progress bar | [docs](https://ui.shadcn.com/docs/components/progress) |
| **Spinner** | Loading spinner | [docs](https://ui.shadcn.com/docs/components/spinner) |
| **Skeleton** | Skeleton loading placeholder | [docs](https://ui.shadcn.com/docs/components/skeleton) |
| **Badge** | Labels and status indicators | [docs](https://ui.shadcn.com/docs/components/badge) |
| **Empty** | Empty state for no data | [docs](https://ui.shadcn.com/docs/components/empty) |

### Display & Media

| Component | Description | Docs |
|-----------|-------------|------|
| **Avatar** | User profile avatar | [docs](https://ui.shadcn.com/docs/components/avatar) |
| **Card** | Card container | [docs](https://ui.shadcn.com/docs/components/card) |
| **Table** | Data display table | [docs](https://ui.shadcn.com/docs/components/table) |
| **Data Table** | Advanced table (sort, filter, paginate) | [docs](https://ui.shadcn.com/docs/components/data-table) |
| **Chart** | Charts using Recharts | [docs](https://ui.shadcn.com/docs/components/chart) |
| **Carousel** | Carousel (Embla Carousel) | [docs](https://ui.shadcn.com/docs/components/carousel) |
| **Aspect Ratio** | Maintains aspect ratio | [docs](https://ui.shadcn.com/docs/components/aspect-ratio) |
| **Typography** | Typography styles | [docs](https://ui.shadcn.com/docs/components/typography) |
| **Item** | Generic item for lists/menus | [docs](https://ui.shadcn.com/docs/components/item) |
| **Kbd** | Keyboard shortcut display | [docs](https://ui.shadcn.com/docs/components/kbd) |

### Misc

| Component | Description | Docs |
|-----------|-------------|------|
| **Collapsible** | Collapsible container | [docs](https://ui.shadcn.com/docs/components/collapsible) |
| **Toggle** | Toggle button | [docs](https://ui.shadcn.com/docs/components/toggle) |
| **Toggle Group** | Group of toggle buttons | [docs](https://ui.shadcn.com/docs/components/toggle-group) |
| **Pagination** | Pagination for lists/tables | [docs](https://ui.shadcn.com/docs/components/pagination) |

---

## Component Discovery

### Via MCP Server

shadcn/ui provides an [MCP Server](https://ui.shadcn.com/docs/mcp) for AI integrations. It allows AI assistants to browse, search, and install components from registries using natural language. Works with Claude Code, Cursor, VS Code (GitHub Copilot), Codex and more.

| Tool | Purpose |
|------|---------|
| `list_components` | Browse full catalog |
| `get_component_metadata` | Props, dependencies, usage |
| `get_component_demo` | Implementation examples |
| `get_component` | Source code retrieval |
| `list_blocks` | Pre-built complex patterns |
| `get_block` | Block source code |

### Via CLI

```bash
# List installable components
bunx shadcn@latest add --help

# Install with dependencies auto-resolved
bunx shadcn@latest add dialog
```

---

## Customization Patterns

### 1. Theme via CSS Variables

Our GPUS theme uses CSS variables in `app.css`:

```css
@layer base {
  :root {
    --background: 0 0% 98%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --accent: 39 90% 55%;       /* Gold */
    --destructive: 0 84.2% 60.2%;
    /* ... more variables */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 39 90% 55%;       /* Gold in dark mode */
    /* ... dark overrides */
  }
}
```

> **Theming Guide:** [shadcn/ui Theming](https://ui.shadcn.com/docs/theming)

### 2. Component Variants with CVA

Use `class-variance-authority` for variant logic:

```typescript
import { cva, type VariantProps } from "class-variance-authority"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        success: "bg-emerald-500/15 text-emerald-500",
        warning: "bg-amber-500/15 text-amber-500",
        destructive: "bg-destructive/15 text-destructive",
        outline: "border border-input text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  className?: string
  children: React.ReactNode
}

export function Badge({ className, variant, children }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)}>{children}</span>
}
```

### 3. Component Extension

**Rule:** Extend in `components/[feature]/`, not in `components/ui/`.

```tsx
// components/loading-button.tsx — CORRECT location
import { Button, type ButtonProps } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean
}

export function LoadingButton({ loading, children, disabled, ...props }: LoadingButtonProps) {
  return (
    <Button disabled={loading || disabled} {...props}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  )
}
```

---

## Common Patterns

### Forms with React Hook Form

shadcn/ui supports multiple form libraries:
- [React Hook Form](https://ui.shadcn.com/docs/forms/react-hook-form) — **used in neondash**
- [TanStack Form](https://ui.shadcn.com/docs/forms/tanstack-form)
- [Forms Overview](https://ui.shadcn.com/docs/forms)

```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const form = useForm<FormValues>({
  resolver: zodResolver(formSchema),
  defaultValues: { name: "", email: "" },
})
```

### Dialog / Modal

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"

<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild>
    <Button variant="outline">Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description text.</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button onClick={() => setOpen(false)}>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Data Table

```tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// For advanced tables, combine with TanStack Table:
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table"
```

> **Advanced Data Table Guide:** [Data Table Docs](https://ui.shadcn.com/docs/components/data-table)

### Dropdown Menu

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
```

### Command Palette

```tsx
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
```

### Toast Notifications (Sonner)

```tsx
import { toast } from "sonner"

// Usage
toast.success("Changes saved!")
toast.error("Something went wrong")
toast.loading("Processing...")
```

---

## Blocks (Pre-built Complex Patterns)

shadcn provides complete UI blocks:

| Category | Examples |
|----------|---------|
| **dashboard** | Dashboard layouts, stat cards, charts |
| **sidebar** | Collapsible navigation sidebars |
| **login** | Authentication flows |
| **calendar** | Calendar interfaces |
| **products** | E-commerce components |

Install blocks:

```bash
bunx shadcn@latest add sidebar-01
bunx shadcn@latest add dashboard-01
```

---

## Dark Mode

- [Dark Mode Overview](https://ui.shadcn.com/docs/dark-mode)
- [Vite Setup](https://ui.shadcn.com/docs/dark-mode/vite) — **relevant for neondash**

Key rules:
- Use `class` strategy (not `media`)
- All color values must use CSS variables, not hardcoded hex
- Test both modes after every component change

---

## Advanced Topics

| Topic | Description | Docs |
|-------|-------------|------|
| **Monorepo** | Using shadcn/ui in monorepo setups | [docs](https://ui.shadcn.com/docs/monorepo) |
| **React 19** | React 19 support + migration guide | [docs](https://ui.shadcn.com/docs/react-19) |
| **Tailwind CSS v4** | Tailwind v4 setup (**our stack**) | [docs](https://ui.shadcn.com/docs/tailwind-v4) |
| **JavaScript** | Using without TypeScript | [docs](https://ui.shadcn.com/docs/javascript) |
| **Figma** | Design resources | [docs](https://ui.shadcn.com/docs/figma) |
| **v0** | Generating UI with v0 by Vercel | [docs](https://ui.shadcn.com/docs/v0) |

---

## Registry System

shadcn/ui includes a [registry system](https://ui.shadcn.com/docs/registry) for publishing and distributing custom component collections.

| Resource | Description | Link |
|----------|-------------|------|
| **Overview** | Creating and publishing registries | [docs](https://ui.shadcn.com/docs/registry) |
| **Getting Started** | Set up your own registry | [docs](https://ui.shadcn.com/docs/registry/getting-started) |
| **Examples** | Example registries | [docs](https://ui.shadcn.com/docs/registry/examples) |
| **Authentication** | Adding auth to registries | [docs](https://ui.shadcn.com/docs/registry/authentication) |
| **Registry MCP** | MCP integration for registries | [docs](https://ui.shadcn.com/docs/registry/mcp) |
| **Registry Schema** | JSON Schema for registry index | [schema](https://ui.shadcn.com/schema/registry.json) |
| **Item Schema** | JSON Schema for individual items | [schema](https://ui.shadcn.com/schema/registry-item.json) |

---

## Accessibility Guarantees

Built on Radix UI primitives, all components include:

| Feature | Guarantee |
|---------|-----------|
| Keyboard navigation | Full keyboard support |
| ARIA attributes | Proper roles and states |
| Focus management | Logical focus flow |
| Screen reader | Announced correctly |

**When customizing, NEVER remove:**
- ARIA attributes
- Keyboard event handlers
- Focus indicators (`focus-visible:ring-*`)

---

## Troubleshooting

### Import Errors

```json
// tsconfig.json — verify path alias
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Style Conflicts

- Verify `app.css` imports Tailwind and CSS variables
- Check CSS variable names match between components and theme
- Ensure `cn()` is imported from `@/lib/utils`

### Missing Dependencies

```bash
# Auto-install via CLI
bunx shadcn@latest add [component]

# Manual check
bun add @radix-ui/react-[primitive]
```

---

## Quality Checklist

Before committing shadcn components:

```
[ ] TypeScript: no type errors (`bun run check`)
[ ] Lint: passes Biome (`bun run lint:check`)
[ ] Accessibility: focus states visible, ARIA intact
[ ] Dark mode: tested and correct
[ ] Light mode: tested and correct
[ ] Responsive: works at mobile/tablet/desktop breakpoints
[ ] Extension: custom components NOT in `components/ui/`
```
