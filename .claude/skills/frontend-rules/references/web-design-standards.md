# Web Design Standards

> Adapted from [Vercel Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines) for the Neondash dashboard.

---

## Focus States

- Interactive elements need visible focus: `focus-visible:ring-*` or equivalent
- Never `outline-none` without focus-visible replacement
- Use `:focus-visible` over `:focus` (avoid focus ring on click)
- Group focus with `:focus-within` for compound controls

## Forms

- Inputs need `autocomplete` and meaningful `name`
- Use correct `type` (`email`, `tel`, `url`, `number`) and `inputmode`
- Never block paste (`onPaste` + `preventDefault` is forbidden)
- Labels clickable via `htmlFor` or wrapping control
- Disable spellcheck on emails, codes, usernames (`spellCheck={false}`)
- Checkboxes/radios: label + control share single hit target (no dead zones)
- Submit button stays enabled until request starts; spinner during request
- Errors inline next to fields; focus first error on submit
- Placeholders end with `…` and show example pattern
- `autocomplete="off"` on non-auth fields to avoid password manager triggers
- Warn before navigation with unsaved changes (`beforeunload` or router guard)

## Animation

- Honor `prefers-reduced-motion` (provide reduced variant or disable)
- Animate `transform`/`opacity` only (compositor-friendly)
- Never `transition: all` — list properties explicitly
- Set correct `transform-origin`
- SVG: transforms on `<g>` wrapper with `transform-box: fill-box; transform-origin: center`
- Animations interruptible — respond to user input mid-animation

## Typography

- `…` not `...`
- Curly quotes `"` `"` not straight `"`
- Non-breaking spaces: `10 MB`, `⌘ K`, brand names
- Loading states end with `…`: `"Loading…"`, `"Saving…"`
- `font-variant-numeric: tabular-nums` for number columns/comparisons
- Use `text-wrap: balance` or `text-pretty` on headings (prevents widows)

## Content Handling

- Text containers handle long content: `truncate`, `line-clamp-*`, or `break-words`
- Flex children need `min-w-0` to allow text truncation
- Handle empty states — don't render broken UI for empty strings/arrays
- User-generated content: anticipate short, average, and very long inputs

## Images

- `<img>` needs explicit `width` and `height` (prevents CLS)
- Below-fold images: `loading="lazy"`
- Above-fold critical images: `fetchpriority="high"`

## Performance

- Large lists (>50 items): virtualize (`@tanstack/react-virtual`, `content-visibility: auto`)
- No layout reads in render (`getBoundingClientRect`, `offsetHeight`, `offsetWidth`, `scrollTop`)
- Batch DOM reads/writes; avoid interleaving
- Prefer uncontrolled inputs; controlled inputs must be cheap per keystroke
- Add `<link rel="preconnect">` for CDN/asset domains
- Critical fonts: `<link rel="preload">` with `font-display: swap`

## Navigation & State

- URL reflects state — filters, tabs, pagination, expanded panels in query params
- Links use `<Link>` / `<a>` (Cmd/Ctrl+click, middle-click support)
- Deep-link all stateful UI (if uses `useState`, consider URL sync via `nuqs` or similar)
- Destructive actions need confirmation modal or undo window — never immediate

## Touch & Interaction

- `touch-action: manipulation` (prevents double-tap zoom delay)
- `-webkit-tap-highlight-color` set intentionally
- `overscroll-behavior: contain` in modals/drawers/sheets
- During drag: disable text selection, `inert` on dragged elements
- `autoFocus` sparingly — desktop only, single primary input; avoid on mobile

## Safe Areas & Layout

- Full-bleed layouts need `env(safe-area-inset-*)` for notches
- Avoid unwanted scrollbars: `overflow-x-hidden` on containers, fix content overflow
- Flex/grid over JS measurement for layout

## Dark Mode & Theming

- `color-scheme: dark` on `<html>` for dark themes (fixes scrollbar, inputs)
- `<meta name="theme-color">` matches page background
- Native `<select>`: explicit `background-color` and `color` (Windows dark mode)

## Locale & i18n

- Dates/times: use `Intl.DateTimeFormat` not hardcoded formats
- Numbers/currency: use `Intl.NumberFormat` not hardcoded formats
- Detect language via `Accept-Language` / `navigator.languages`, not IP

## Hydration Safety

- Inputs with `value` need `onChange` (or use `defaultValue` for uncontrolled)
- Date/time rendering: guard against hydration mismatch (server vs client)
- `suppressHydrationWarning` only where truly needed

## Hover & Interactive States

- Buttons/links need `hover:` state (visual feedback)
- Interactive states increase contrast: hover/active/focus more prominent than rest

## Content & Copy

- Active voice: "Install the CLI" not "The CLI will be installed"
- Title Case for headings/buttons (Chicago style)
- Numerals for counts: "8 deployments" not "eight"
- Specific button labels: "Save API Key" not "Continue"
- Error messages include fix/next step, not just problem
- Second person; avoid first person
- `&` over "and" where space-constrained

---

## Anti-Patterns (Flag These)

| Anti-Pattern | Why |
|---|---|
| `user-scalable=no` or `maximum-scale=1` | Disables zoom, a11y violation |
| `onPaste` + `preventDefault` | Blocks paste on passwords/emails |
| `transition: all` | Performance tax, unpredictable animation |
| `outline-none` without focus-visible replacement | Keyboard users lose navigation |
| Inline `onClick` navigation without `<Link>` | Breaks Cmd+Click, middle-click |
| `<div>` or `<span>` with click handlers | Should be `<button>` for a11y |
| Images without dimensions | Causes CLS (layout shift) |
| Large arrays `.map()` without virtualization | DOM bloat, scroll jank |
| Form inputs without labels | Screen readers can't identify |
| Icon buttons without `aria-label` | No accessible name |
| Hardcoded date/number formats | Use `Intl.*` for localization |
| `autoFocus` without clear justification | Disruptive on mobile, unexpected scroll |
