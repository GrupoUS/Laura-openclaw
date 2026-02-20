---
title: Frontend Debug
description: Debug workflow focado em frontend React, componentes UI, flickering, console errors e integração Frontend↔Backend usando react-doctor e agent-browser
---

# /frontend-debug — Debug Sistemático de Frontend

**ARGUMENTS**: $ARGUMENTS

> **Skills Obrigatórias**: `frontend-rules`, `webapp-testing`

---

## 0. IRON LAW (NUNCA VIOLAR)

```
NO FIX ACTIONS WITHOUT ROOT CAUSE VISUAL E DIAGNÓSTICO ESTÁTICO FIRST
```

Se você não entender a causa raiz visual via `agent-browser` ou obter o health-score do componente através do `react-doctor`, você NÃO PODE propor correções.

---

## 1. PRIMEIRA AÇÃO: Carregar Skills

```
view_file → ~/.gemini/antigravity/skills/frontend-rules/SKILL.md
view_file → ~/.gemini/antigravity/skills/webapp-testing/SKILL.md
```

Isso garante as regras de UI (tokens semânticos, shadcn, ScrollArea) e carrega o manual do `react-doctor` + `agent-browser`.

---

## 2. FASE 0: Diagnósticos e Reconhecimento (SEMPRE PRIMEIRO)

Execute em **paralelo** para máxima eficiência:

### 2.1 Diagnóstico Estático (`react-doctor`)
```bash
bunx react-doctor ./apps/web/src/pages/alvo --verbose
```
> Busque: dependency arrays defeituosos, Dead Code, erros de correctness que causam rerenders/flickering.

### 2.2 Checagem de TypeScript e Linting
```bash
bun run check 2>&1 | tail -30
bun run lint:check 2>&1 | tail -30
```

### 2.3 Investigação Visual e Console (`agent-browser`)
```bash
# Refs da tela:
bunx agent-browser open http://localhost:5173/alvo && bunx agent-browser wait --load networkidle && bunx agent-browser snapshot -i

# Console Warnings/Errors:
bunx agent-browser errors && bunx agent-browser console

# Screenshot Anotado (para problemas visuais/overflow):
bunx agent-browser screenshot --annotate
```

---

## 3. FASE 1: Investigação Paralela

### 3.1 Mapear Camadas Afetadas

| Camada | Ferramentas | O que investigar |
|--------|-------------|-----------------|
| Frontend/UI | `grep_search`, `view_file` em `hooks/`, `components/`, `pages/` | Estado, hooks, reflows, tokens |
| Backend/API | `grep_search`, `view_file` em `routers/`, `services/` | tRPC procedures, respostas |
| Integração | Output do `agent-browser console` e `errors` | Requests falhando, Suspense loops |

### 3.2 Investigar em Paralelo

Use **parallel tool calls** para investigar simultaneamente:

```
1. grep_search → erro reportado em apps/web/src/
2. view_file_outline → componente afetado
3. grep_search → hook ou mutation envolvido em apps/api/src/
```

### 3.3 Para Cada Camada

1. **Analisar output do `react-doctor`** — quais regras quebraram?
2. **Analisar output do `agent-browser console`** — há warnings React (`key`, `uncontrolled to controlled`)?
3. **Traçar fluxo de dados** — de UI → tRPC → DB → resposta → re-render
4. **Identificar divergência** — onde esperado ≠ atual?

---

## 4. ENQUANTO INVESTIGA: Reflexão Ativa

**Padrões comuns de Red Flags para Frontend:**

1. **Flickering de Select/Input** → Falta `useMemo`, formulário perdendo ref, Select shadcn com `value` não-controlado.
2. **Cores hardcoded ou layout quebrado** → `bg-[#xyz]` deve ser `bg-primary` (tokens GPUS).
3. **Loop de Mutation** → `useEffect` disparando `tRPC` mutation em loop infinito.
4. **Overflow escondido** → `overflow-hidden` no wrapper em vez de ScrollArea.

---

## 5. FASE 2: Consolidar Hipóteses

```markdown
## Hipótese Principal
[Descrição clara do root cause visual/comportamental]

## Evidência
- react-doctor: regra X quebrada em arquivo.tsx:123
- agent-browser console: Warning "key" em componente Y
- TypeScript: erro de tipo em mutation Z

## Linha(s) Crítica(s)
- componente.tsx:45 — [problema específico]

## Hipóteses Alternativas
1. [Hipótese 2]
2. [Hipótese 3]
```

---

## 6. FASE 3: Implementar Correção (UMA POR VEZ)

### Regras de Ouro
- **UMA correção por vez**
- O fix obedece à `frontend-rules`? (Token Semântico, shadcn, ScrollArea)
- Use `useMemo` sobre `useEffect` quando estado for derivável
- **Corrigir no SOURCE, não no sintoma**

### Verificar Imediatamente
```bash
bun run check && bun run lint:check
```

---

## 7. FASE 4: Quality & Validation Gates

### Validação Automatizada
```bash
bun run check       # TypeScript
bun run lint:check  # Biome + OXLint
bun test            # Tests
```

### Validação Visual (agent-browser)
```bash
# Reproduzir a ação problemática:
bunx agent-browser click @e1 && bunx agent-browser wait --load networkidle && bunx agent-browser errors

# Re-score com react-doctor:
bunx react-doctor path/to/modificado --verbose
```

### Se falhar:
1. **NÃO adicione mais correções**
2. **Analise o novo erro**
3. **Volte para Fase 1 se necessário**

---

## 8. Red Flags — PARAR

**PARAR se você:**
- Propõe correção antes de rodar `react-doctor` E `agent-browser`
- Faz múltiplas mudanças de uma vez
- Ignora warnings do console
- Pula verificação de testes

**Se 3+ correções falharam:**
- Questione a arquitetura
- Use `notify_user` para conversar com o usuário
- NÃO tente outra correção

---

## 9. Skills Relacionadas

| Domain | Skill | Path |
|--------|-------|------|
| Frontend Rules | `frontend-rules` | `~/.gemini/antigravity/skills/frontend-rules/SKILL.md` |
| Webapp Testing | `webapp-testing` | `~/.gemini/antigravity/skills/webapp-testing/SKILL.md` |
| Debugging | `debugger` | `~/.gemini/antigravity/skills/debugger/SKILL.md` |
| Backend | `backend-design` | `~/.gemini/antigravity/skills/backend-design/SKILL.md` |

> **Bug multi-camada?** Use `/debug` em vez de `/frontend-debug` para investigação full-stack.

---

## Referências

- `~/.gemini/antigravity/skills/webapp-testing/SKILL.md` — react-doctor + agent-browser
- `~/.gemini/antigravity/skills/frontend-rules/SKILL.md` — GPUS tokens, shadcn, ScrollArea
- `~/.gemini/antigravity/skills/debugger/SKILL.md` — Metodologia de 4 fases
- `/debug` workflow — Para bugs full-stack
- `/implement` workflow — Para aplicar correções complexas
