---
name: agent-browser
description: "Browser automation CLI for AI agents. Use for web scraping, testing, form filling, and any browser automation tasks."
metadata: {"openclaw":{"emoji":"🌐","requires":{"bins":["agent-browser"]}}}
---

# Agent Browser Skill

## Overview

> Browser automation CLI for AI agents. Use for web scraping, testing, form filling, and any browser automation tasks. Provides semantic selectors and snapshot-based refs for precise element targeting.


CLI for headless browser automation optimized for AI agents.

> **Core Pattern:** `open URL → snapshot -i → click @ref / fill @ref → re-snapshot`

## Installation

```bash
npm install -g agent-browser
agent-browser install  # Downloads Chromium
```

Check: `agent-browser --version`

---

## AI Workflow (Optimal)

### Step 1: Navigate
```bash
agent-browser open https://example.com
```

### Step 2: Get Snapshot
```bash
agent-browser snapshot -i --json
```

Returns accessibility tree with refs:
```json
{
  "success": true,
  "refs": {
    "@e1": {"role": "button", "name": "Submit"},
    "@e2": {"role": "textbox", "name": "Email"}
  }
}
```

### Step 3: Interact Using Refs
```bash
agent-browser fill @e2 "email@example.com"
agent-browser click @e1
```

### Step 4: Re-snapshot After Changes
```bash
agent-browser snapshot -i --json
```

---

## Core Commands

| Command | Description |
|---------|-------------|
| `open <url>` | Navigate to URL |
| `click <sel>` | Click element |
| `fill <sel> <text>` | Clear and fill input |
| `type <sel> <text>` | Type into element |
| `press <key>` | Press key (Enter, Tab) |
| `snapshot` | Get accessibility tree with refs |
| `screenshot [path]` | Take screenshot |
| `close` | Close browser |

---

## Selectors

### Refs (Best for AI)
After `snapshot -i`, use refs directly:
```bash
agent-browser click @e1
agent-browser fill @e2 "text"
```

### CSS Selectors
```bash
agent-browser click "#submit-btn"
agent-browser fill "input[name='email']" "test@test.com"
```

### Semantic Locators
```bash
agent-browser find role button click --name "Submit"
agent-browser find text "Sign In" click
agent-browser find label "Email" fill "test@test.com"
```

---

## Get Info

```bash
agent-browser get text <sel>   # Text content
agent-browser get value <sel>  # Input value
agent-browser get url          # Current URL
agent-browser get title        # Page title
```

---

## Wait Commands

```bash
agent-browser wait <selector>       # Wait for element
agent-browser wait 2000             # Wait 2 seconds
agent-browser wait --text "Welcome" # Wait for text
agent-browser wait --load networkidle # Wait for page load
```

---

## Sessions

Persist browser state across commands:
```bash
agent-browser open https://site.com --session my-session
agent-browser click @e1 --session my-session
```

---

## JSON Mode

Use `--json` for machine-readable output:
```bash
agent-browser snapshot --json
agent-browser get text @e1 --json
agent-browser is visible @e2 --json
```

---

## Common Patterns

### Login Flow
```bash
agent-browser open https://site.com/login
agent-browser snapshot -i
agent-browser fill @e1 "username"
agent-browser fill @e2 "password"
agent-browser click @e3  # Submit button
agent-browser wait --load networkidle
agent-browser snapshot -i
```

### Form Submission
```bash
agent-browser open https://site.com/form
agent-browser snapshot -i
agent-browser fill @e1 "Name"
agent-browser fill @e2 "email@test.com"
agent-browser select @e3 "option-value"
agent-browser check @e4
agent-browser click @e5  # Submit
```

### Screenshot for Verification
```bash
agent-browser open https://site.com
agent-browser wait --load networkidle
agent-browser screenshot ~/Desktop/page.png --full
```

---

## Tips

1. **Always snapshot after navigation** — page content determines refs
2. **Use refs over CSS** — more stable, AI-friendly
3. **JSON mode for parsing** — easier to process output
4. **Sessions for multi-step** — maintain state across commands
5. **Wait for networkidle** — ensure page fully loaded
