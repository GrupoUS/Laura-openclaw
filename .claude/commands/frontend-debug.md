---
description: Debug workflow focado em frontend, React, componentes shadcn, flickering, UI e integração com Backend/Neon
---

# /frontend-debug - Debug com Foco em React/UI e Integração

**ARGUMENTS**: $ARGUMENTS

> **Skills Principais**: `frontend-rules`, `webapp-testing`

---

## 0. IRON LAW (NUNCA VIOLAR)

```
NO FIX ACTIONS WITHOUT ROOT CAUSE VISUAL E DIAGNÓSTICO ESTÁTICO FIRST
```

Se você não entender a causa raiz visual via `agent-browser` ou obter o health-score do componente através do `react-doctor`, você NÃO PODE propor correções. Erros de frontend costumam enganar; a raiz normalmente é gerenciamento de estado iterativo, key faults do React, Suspense re-render ou prop-drilling errado batendo na Neon DB.

---

## 1. PRIMEIRA AÇÃO: Invocar Skills e Diagnosticar UI

```typescript
Skill("frontend-rules")   // Padrões shadcn e GPUS Design (Tailwind)
Skill("webapp-testing")  // Testes de Console/Rede via Vercel agent-browser
```

Isso garante as regras de Ouro de interface e carrega o manual do uso do `react-doctor` e `agent-browser`.

---

## 2. FASE 0: Diagnósticos e Reconhecimento Focados (SEMPRE PRIMEIRO)

### 2.1 Diagnóstico Estático (Health Check & Dead Code)
Sempre execute o react-doctor sobre o arquivo/raiz que contém o problema.
```bash
bunx react-doctor ./apps/web/src/pages/alvo --verbose
```
> Busque por avisos críticos que sinalizem *dependencies arrays* defasados, códigos inacessíveis (Dead Code) e brechas nativas do React que podem causar rerenders e *flickering*.

### 2.2 Investigação Visual, Console e Dom (`agent-browser`)
Se houver indícios de erro de render, hidratação ou tela falhando, use o `agent-browser` para levantar o Snapshot interativo (`Refs`) e pegar falhas de console:

```bash
# 1. Pega Refs da tela:
bunx agent-browser open http://localhost:5173/alvo && bunx agent-browser wait --load networkidle && bunx agent-browser snapshot -i

# 2. Varre o Console para Warnings vitais:
bunx agent-browser errors && bunx agent-browser console
```

> **Atenção**: Analise Warnings do React: `key`, `uncontrolled to controlled`, falhas hidratação, etc.
Se for problema de Layout/Overflow visual, rode `bunx agent-browser screenshot --annotate` e confesse os números dos elementos.

---

## 3. FASE 1: Investigação Paralela (Frontend e Integrações)

### 3.1 Criar Team de Investigação

```typescript
TeamCreate({
  team_name: "front-debug-{slug}",
  description: "Investigar Bug Visual/Componente: $ARGUMENTS"
})
```

### 3.2 Agentes em Paralelo 

```typescript
// 1. FRONTEND ESPECIALISTA
Task({
  subagent_type: "frontend-specialist",
  description: "Investigar componentes UI e React",
  prompt: `TASK: Analisar componentes React e layout
  
CONTEXTO: $ARGUMENTS

SUA MISSÃO:
1. Analise o output do "react-doctor" feito na Fase 0.
2. Revise hooks envolvidos (useEffect vs useMemo vs Estado Derivado).
3. Busque quebra das regras de UI (cores HEX).
4. Averigúe por que o estado causa flickering ou reflow.

RETORNE: Ponto anatômico do bug.`,
  run_in_background: true
})

// 2. BACKEND/DATA INTEGRATION
Task({
  subagent_type: "backend-specialist",
  description: "Investigar falhas tRPC/Neon e Console Errors",
  prompt: `TASK: Garantir que a ação da UI funciona contra o backend/DB Neon
  
CONTEXTO: $ARGUMENTS

SUA MISSÃO:
1. Considerando o erro do "agent-browser console" rodado antes, a consulta (useQuery/Mutation) foi resolvida?
2. Existem falhas silenciosas na procedure ou Drizzle?
3. Há latência batendo o Suspense bruscamente?

RETORNE: Falhas de tráfego. Não corrija.`,
  run_in_background: true
})
```

---

## 4. ENQUANTO AGENTES RODAM: Guias Manuais

**Identifique padrões comuns:**
1. **Flickering de Select/Input:** Falta `useMemo` com recálculo ou o formulário perdendo ref? (Ex: Select shadcn com value não-controlado).
2. **Cores hardcoded ou layout quebrado:** Substitua `bg-[#xyz]` por `bg-primary` da lib GPUS.
3. **Erros DB de Frontend:** Mutação no `tRPC` loopando no useEffect.

---

## 5. FASE 2: Consolidar Hipóteses

O Front e API/DB concordam sobre um erro? (Ex: A UI pisca porque a Network Call não foi memoizada e dispara Suspense).
**Forme HIPÓTESE PRINCIPAL usando Logs do agent-browser + react-doctor.**

---

## 6. FASE 3: Implementar Correção 

```typescript
Edit({ file_path: "apps/web/src/...", old_string: "...", new_string: "..." })
```

### Verificar
```bash
bun run check && bun run lint:check
```

---

## 7. FASE 4: Quality & Validation Gates

- Rode de novo a ação problemática no `agent-browser`:
```bash
# Validar se o erro do console persistiu:
bunx agent-browser click @e1 && bunx agent-browser wait --load networkidle && bunx agent-browser errors
```
- E valide a pontuação final usando `bunx react-doctor path/to/modificado`.

---

## 8. CLEANUP

```typescript
SendMessage({ type: "shutdown_request", recipient: "frontend-specialist", ... })
TeamDelete()
```
