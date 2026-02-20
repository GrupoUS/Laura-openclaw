---
name: webapp-testing
description: Use when validating web UI behavior, user journeys, regressions, checking rules structure of React with react-doctor, browser-side errors, and integrating Vercel agent-browser for DOM automation.
---

# Webapp Testing & Diagnostic Skill

Use this skill when validating web UI behavior, checking semantic/React code quality, reproducing user journeys, and debugging browser-side errors/console warnings.

## When to Use

- Testing critical user flows (login, form submissions, navigation)
- Diagnosing React *dead code*, severe logic flaws, or rule breaks without opening the browser (`react-doctor`).
- Validating UI behavior and console warnings/errors programmatically via `agent-browser`.
- Detecting regressions after code changes.
- Reproducing rendering failures, hydration crashes, and missing buttons via CLI DOM querying.
- Capturing annotated screenshots (`--annotate`) to feed back to Visual/UX agents.
- Validating state management and data flow without brittle Playwright Python scripts.

## When NOT to Use

- Do NOT use for API-only testing (use backend test tools instead)
- Do NOT use for load/performance testing
- Do NOT use old Playwright Python scripts (they were deprecated and removed).
- Do NOT use unit-testing commands (`vitest` / `jest`) via this skill.

## 🛠️ THE NEW STANDARD: `react-doctor` + `agent-browser`

A validação de Frontend agora é dividida em duas vias obrigatórias e estritamente encadeadas.

### 1. Diagnóstico Estático de Saúde do React (`react-doctor`)

Antes de gastar tempo debugando no navegador, audite estaticamente via CLi. O `react-doctor` encontra security, performance, correctness, e architecture issues gerando um Output de 0-100 score + diagnostics acionáveis.

**Comando Básico:**
```bash
bunx react-doctor ./apps/web/src/pages/sua-feature --verbose
```
**O que procurar:**
- Erros severos marcando `dependency arrays` defeituosos (o Root cause de muito form-flickering).
- Componentes não exportados ou lógicas de *Dead Code*.
- Usar a tag `--fix` quando recomendado. Ex: `bunx react-doctor . --diff main --fix`.

### 2. Automação Dinâmica e DOM (`agent-browser`)

O `agent-browser` (Substitui scripts em Playwright local) comunica-se nativamente e de maneira absurdamente mais rápida com o Chromium via CLI e executa comandos encadeados.

**Padrão Ouro: Reconnaissance-Then-Action**
Nunca adivinhe seletores. Sempre abra a página e gere um *Snapshot Interativo* para capturar os `Refs` (`@e1`, `@e2`, etc.).

#### Exemplo de Fluxo
```bash
# 1. Abre a página encadeado (&&) com Wait Idle e Snapshot Interativo
bunx agent-browser open http://localhost:5173/admin && bunx agent-browser wait --load networkidle && bunx agent-browser snapshot -i

# O output listará as referências dos nós interativos (ex: @e1 [input email], @e3 [button] "Login")

# 2. Interaja encandeando ações
bunx agent-browser fill @e1 "teste@teste.com" && bunx agent-browser click @e3 && bunx agent-browser wait --load networkidle

# 3. Verificando o Console por Hydration/React Errors (CRÍTICO)
bunx agent-browser console
bunx agent-browser errors

# 4. Capturar Evidência Visual em caso de dúvida de UI (Annotated)
bunx agent-browser screenshot --annotate
```

## Primary Policy

1. Default browser QA target is `https://staging.neondash.com.br` (or `localhost:5173` se solicitado no fluxo de desenvolvimento).
2. **NUNCA** construa scrips manuais de automação. **SEMPRE** use CLI nativo `bunx agent-browser` (chain commands with `&&`).
3. Se o bug alegado for genérico (lento/pisca/quebrado), rode antes um `bunx react-doctor path/to/folder --verbose`. 

## Execution Checklist

1. **Check Code Health**: Rodar o `react-doctor` na rota afetada.
2. **Navigate**: `bunx agent-browser open <url>`.
3. **Wait & Recon**: `bunx agent-browser wait --load networkidle && bunx agent-browser snapshot -i`.
4. **Act**: Executar CLI (fill, click, select) baseado nas refs obtidas no Recon.
5. **Re-Snapshot**: `bunx agent-browser snapshot -i` (Refs (`@e`) morrem a cada navegação/mudança de página).
6. **Audit**: `bunx agent-browser console` para garantir ausência de Warning Lists massos do React.

## Anti-Patterns

| Anti-Pattern                           | Why Bad                                   | Correct Approach                        |
| -------------------------------------- | ----------------------------------------- | --------------------------------------- |
| **Scripts Playwright Locais**          | Frágeis, desatualizados, poluentes        | Use `bunx agent-browser` encadeado (`&&`) |
| **Adivinhar HTML/Selectors**           | Quebra ao menor Refactor da Vercel/UI     | Use `agent-browser snapshot -i` primeiro|
| **Ignorar Console e Warnings**         | Key props e Hydration errors matam o Flow | Verifique o `npx agent-browser errors`  |
| **Não resetar Ref Numbers**            | Clicar após load em `@e5` pode ser erro   | Use Snapshot a CADA load de rede.       |
| **Rodar sem networkidle**              | UI vazia testada.                         | `wait --load networkidle` antes de tudo |

### Helper Cheatsheet - `agent-browser`

- **Navegar:** `open <url>` ou `close`
- **Recon(Snapshot):** `snapshot -i` (Refs) ou `snapshot -i -C` (incluso divs com cursor interactives)
- **Ações:** `click @e1`, `fill @e2 "texto"`, `check @e3`, `select @e4 "opt"`
- **Semantic Finds:** `find text "Sign In" click` ou `find role button click --name "Submit"`
- **Sessões Isoladas:** `agent-browser --session user1 open url`
- **Inspecionar JS:** `eval 'document.title'`

Não se esqueça: No debug visual, quando houver suspeitas de overflow escondido ou botões sumindo da Viewport, use a feature da flag `--annotate` do screenshot.
