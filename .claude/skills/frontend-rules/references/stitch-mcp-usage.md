# Stitch MCP — AI UI Generation

> Deep reference for Google Stitch MCP integration in neondash.
> For quick reference, see the Stitch section in `SKILL.md`.

---

## Overview

Stitch MCP é um servidor MCP oficial do Google que permite que agentes de IA (como OpenCode, Claude Code, Cursor) interajam diretamente com o Google Stitch para:

- Listar projetos e screens
- Gerar novas UIs a partir de prompts de texto
- Fetch código HTML/CSS de screens existentes
- Criar variantes de design
- Criar snapshots de UI

**Package oficial:** `stitch-mcp` (npm)
**Setup docs:** https://stitch.withgoogle.com/docs/mcp/setup

---

## Setup

### Prerequisites

```bash
# 1. Install gcloud CLI
brew install google-cloud-sdk

# 2. Login to Google Cloud
gcloud auth login

# 3. Set project
gcloud config set project neondash-487514

# 4. Setup ADC (Application Default Credentials)
gcloud auth application-default login
gcloud auth application-default set-quota-project neondash-487514

# 5. Enable Stitch API
gcloud beta services mcp enable stitch.googleapis.com --project=neondash-487514

# 6. Verify
npx -y @_davideast/stitch-mcp doctor --verbose
```

### OpenCode Configuration

Adicione ao `~/.config/opencode/opencode.json`:

```json
"mcp": {
  "stitch": {
    "type": "local",
    "command": ["bunx", "-y", "stitch-mcp"],
    "environment": {
      "GOOGLE_CLOUD_PROJECT": "neondash-487514"
    }
  }
}
```

---

## MCP Tools Reference

### list_projects

Lista todos os projetos Stitch acessíveis ao usuário.

```typescript
// Tool: stitch_list_projects
// Returns: Array de projetos com metadata
```

**Response:**

```json
{
  "projects": [
    {
      "name": "projects/18341352454972768903",
      "title": "Neon Admin Insights Dashboard",
      "visibility": "PUBLIC",
      "createTime": "2026-02-01T21:58:20.114518Z",
      "updateTime": "2026-02-02T13:23:01.956005Z",
      "projectType": "TEXT_TO_UI_PRO",
      "deviceType": "DESKTOP|MOBILE",
      "designTheme": {
        "colorMode": "LIGHT|DARK",
        "font": "MANROPE|SPACE_GROTESK|...",
        "roundness": "ROUND_EIGHT|ROUND_TWELVE|...",
        "customColor": "#ec1380",
        "saturation": 3
      },
      "screenInstances": [...]
    }
  ]
}
```

---

### list_screens

Lista todas as screens de um projeto específico.

```typescript
// Tool: stitch_list_screens
// Parameters:
//   - projectId: string (required)
```

**Response:**

```json
{
  "screens": [
    {
      "name": "projects/.../screens/f07378b3640c4179bf14f52ca13a2ed5",
      "title": "Student Profile & Revenue Tracking",
      "screenshot": {
        "name": "projects/.../files/...",
        "downloadUrl": "https://lh3.googleusercontent.com/..."
      },
      "htmlCode": {},
      "width": "1376",
      "height": "768",
      "deviceType": "DESKTOP"
    }
  ]
}
```

---

### generate_screen_from_text

Gera uma nova screen a partir de um prompt de texto.

```typescript
// Tool: stitch_generate_screen_from_text
// Parameters:
//   - projectId: string (required)
//   - prompt: string (required) - Descrição da UI desejada
//   - deviceType?: "DEVICE_TYPE_UNSPECIFIED" | "MOBILE" | "DESKTOP" | "TABLET"
//   - modelId?: "MODEL_ID_UNSPECIFIED" | "GEMINI_3_PRO" | "GEMINI_3_FLASH"
```

**Exemplo de uso:**

```
Gerar uma página de dashboard para um sistema de mentoria com:
- Header com logo e menu de navegação
- Cards de métricas (alunos ativos, receita, etc)
- Tabela de últimos mentorados
- Gráfico de crescimento
- Tema: Dark com accent gold
```

---

### fetch_screen_code

Busca o código HTML/CSS de uma screen existente.

```typescript
// Tool: stitch_fetch_screen_code
// Parameters:
//   - projectId: string (required)
//   - screenId: string (required)
```

---

### get_screen

Obtém detalhes de uma screen específica.

```typescript
// Tool: stitch_get_screen
// Parameters:
//   - name: string (required) - Full resource name
//   - projectId: string (required)
//   - screenId: string (required)
```

---

### get_project

Obtém detalhes de um projeto específico.

```typescript
// Tool: stitch_get_project
// Parameters:
//   - name: string (required)
```

---

### generate_variants

Gera variantes de design de uma screen existente.

```typescript
// Tool: stitch_generate_variants
// Parameters:
//   - projectId: string (required)
//   - selectedScreenIds: string[] (required)
//   - prompt: string (required) - Descrição das variações
//   - deviceType?: "DEVICE_TYPE_UNSPECIFIED" | "MOBILE" | "DESKTOP" | "TABLET"
//   - variantOptions?: {
//       aspects?: ("LAYOUT"|"COLOR_SCHEME"|"IMAGES"|"TEXT_FONT"|"TEXT_CONTENT")[],
//       creativeRange?: "CREATIVE_RANGE_UNSPECIFIED"|"REFINE"|"EXPLORE"|"REIMAGINE",
//       variantCount?: number (1-5)
//     }
```

---

### edit_screens

Edita screens existentes com prompts de texto.

```typescript
// Tool: stitch_edit_screens
// Parameters:
//   - projectId: string (required)
//   - selectedScreenIds: string[] (required)
//   - prompt: string (required) - Descrição da modificação
//   - deviceType?: "DEVICE_TYPE_UNSPECIFIED" | "MOBILE" | "DESKTOP" | "TABLET"
//   - modelId?: "MODEL_ID_UNSPECIFIED" | "GEMINI_3_PRO" | "GEMINI_3_FLASH"
```

---

### create_project

Cria um novo projeto Stitch.

```typescript
// Tool: stitch_create_project
// Parameters:
//   - title?: string - Nome do projeto
```

---

## GPUS Stitch Template

Use este template ao gerar screens com Stitch:

```markdown
A professional [PAGE_TYPE] for a mentorship/dashboard platform.
Clean, modern interface with generous whitespace and clear visual hierarchy.

**DESIGN SYSTEM (GPUS - Mandatory):**

- Platform: Web, Desktop-first (1280px+)
- Background: Deep Navy (#0a0f1c) / cards Dark Surface (#111827)
- Primary Accent: Electric Gold (#f5a623) for CTAs and highlights
- Secondary: Azul Petróleo (#0f4c75) for containers
- Text: Off-White (#f9fafb) headings, Cool Gray (#9ca3af) labels
- Destructive: Soft Red (#ef4444) for alerts
- Success: Emerald (#10b981)
- Warning: Amber (#f59e0b)

**TYPOGRAPHY:**

- Font: Manrope (Google Fonts)
- Headings: Bold, 24-32px
- Body: Regular, 14-16px

**COMPONENTS:**

- Buttons: Rounded 8px, gold primary (#f5a623), outline secondary
- Cards: Rounded 12px, dark surface (#111827), subtle gold border on hover
- Inputs: Dark bg (#1f2937), gold focus ring
- Tables: Striped rows, gold header accent

**EFFECTS:**

- Hover: Subtle gold glow (box-shadow: 0 0 20px rgba(245, 166, 35, 0.2))
- Transitions: 200ms ease-out
- Focus: Visible gold ring

**LIGHT MODE ALTERNATIVE:**
Swap: Background → Warm White (#fafafa), Surface → Pure White (#ffffff),
Text → Near Black (#111827), Gold accent stays same

**Page Structure:**

1. **Header:** [logo, nav menu, user avatar]
2. **Main:** [content area with cards/tables/charts]
3. **Footer:** [copyright, links]
```

---

## Pipeline: Stitch → Neondash React

### Step 1: Generate or Select Screen

```typescript
// Listar projetos
stitch_list_projects();

// Listar screens de um projeto
stitch_list_screens({ projectId: "18341352454972768903" });

// Gerar nova screen
stitch_generate_screen_from_text({
  projectId: "18341352454972768903",
  prompt: "A dashboard metrics page...",
  deviceType: "DESKTOP",
});
```

### Step 2: Fetch HTML Code

```typescript
stitch_fetch_screen_code({
  projectId: "18341352454972768903",
  screenId: "f07378b3640c4179bf14f52ca13a2ed5",
});
```

### Step 3: Convert to React

| Stitch Output        | Neondash Equivalent                           |
| -------------------- | --------------------------------------------- |
| `<button>`           | `<Button variant="default">` from shadcn      |
| `<div class="card">` | `<Card><CardHeader><CardContent>` from shadcn |
| `<input>`            | `<Input>` from shadcn                         |
| `<select>`           | `<Select>` from shadcn                        |
| `<dialog>`           | `<Dialog>` from shadcn                        |
| `<table>`            | `<Table>` from shadcn or TanStack Table       |
| `<nav>`              | Sidebar component                             |
| Arbitrary colors     | GPUS CSS variables (`hsl(var(--primary))`)    |
| Inline styles        | Tailwind classes                              |
| Static routes        | TanStack Router (`routes/*.tsx`)              |
| Static data          | tRPC queries (`routers/*.ts`)                 |

### Step 4: Integrate

1. Create component in `apps/web/src/components/[feature]/`
2. Use GPUS semantic tokens, not hardcoded colors
3. Add tRPC data fetching if needed
4. Use shadcn/ui primitives
5. Test responsive at 375px, 768px, 1024px, 1440px

---

## Best Practices

### Do

- ✅ Use GPUS template for consistent branding
- ✅ Prefer shadcn/ui over custom components
- ✅ Fetch existing screens before generating new ones
- ✅ Test generated UI in both light/dark modes
- ✅ Use semantic tokens from GPUS theme

### Don't

- ❌ Don't hardcode hex colors (use CSS variables)
- ❌ Don't skip accessibility testing
- ❌ Don't use generated code as-is (review and adapt)
- ❌ Don't ignore responsive behavior

---

## Neondash Projects

O projeto atual tem 2 projetos Stitch:

| Project              | Title                         | Screens | Theme            |
| -------------------- | ----------------------------- | ------- | ---------------- |
| 18341352454972768903 | Neon Admin Insights Dashboard | 8       | Light            |
| 6619250935489806625  | Mentor Directory Luxury View  | 7       | Dark (cyberpunk) |

---

## Troubleshooting

### "MCP server not found"

Reinicie o OpenCode após modificar `opencode.json`.

### "Authentication error"

```bash
# Verify gcloud auth
gcloud auth list

# Re-run ADC setup
gcloud auth application-default login

# Check doctor
npx -y @_davideast/stitch-mcp doctor --verbose
```

### "Project not found"

O projeto Stitch precisa existir em https://stitch.withgoogle.com

### "API not enabled"

```bash
gcloud beta services mcp enable stitch.googleapis.com --project=neondash-487514
```
