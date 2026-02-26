---
description: Captura aprendizados após tarefas bem-sucedidas, aprimora skills e AGENTS.md para evitar erros recorrentes
---

# /evolve — Captura de Aprendizados

**ARGUMENTS**: $ARGUMENTS

---

## 1. PRIMEIRA AÇÃO: Invocar Skills

```typescript
Skill("evolution-core"); // Memória persistente + CLI
```

---

## 2. FLUXO DE CAPTURA

### 2.1 Coletar Contexto da Sessão

Analise a conversa atual para identificar:

```markdown
## Contexto Identificado

### Tarefa Realizada
[Breve descrição do que foi feito]

### Problema Encontrado
[Descrição do bug/erro/issue]

### Root Cause
[Causa raiz identificada]

### Solução Aplicada
[Código ou mudanças específicas]

### Validação
[Comandos executados: check, lint, test, etc.]
```

### 2.2 Persistir no evolution-core

```bash
python3 .claude/skills/evolution-core/scripts/memory_manager.py capture \
  "[descrição do aprendizado]" \
  -t bug_fix \
  --files "[arquivos modificados]" \
  --root-cause "[causa raiz]"
```

---

## 3. SELEÇÃO DE SKILLS (Semi-Automática)

### 3.1 Mapear Domínio Afetado

Com base nos arquivos/modificações, sugerir skills relevantes:

| Domínio | Arquivos | Skill |
|---------|----------|-------|
| Backend/tRPC | `apps/api/src/routers/` | `debugger` |
| Database | `apps/api/drizzle/` | `debugger` |
| Frontend/React | `apps/web/src/` | `debugger` |
| WhatsApp/Meta | `apps/api/src/services/` | `meta-api-integration` |
| Docker/Deploy | `Dockerfile`, `docker-compose` | `docker-deploy` |
| Performance | Otimizações gerais | `performance-optimization` |

### 3.2 Perguntar ao Usuário

```
Com base na tarefa realizada, sugiro aprimorar:

1. ✅ debugger (Backend/Database)
2. ✅ apps/api/drizzle/AGENTS.md (Schema rules)
3. ⬜ meta-api-integration (não relacionado)

Quais deseja atualizar? [1,2,3 ou Enter para todos marcados]
```

---

## 4. APRIMORAR SKILLS

### 4.1 Template de Atualização

Para cada skill selecionada, adicionar em `references/` ou seção do SKILL.md:

```markdown
## Caso: [Nome do Bug/Problema]

**Sintoma:** [O que o usuário percebe]
**Root Cause:** [Causa técnica]
**Fix:** [Solução aplicada]
**Arquivos:** `[lista de arquivos]`
**Validação:** `bun run check && bun run lint:check && bun test`

### Anti-Pattern Descoberto

```typescript
// ❌ ERRADO: [descrição]
[código problemático]

// ✅ CORRETO: [descrição]
[código correto]
```
```

### 4.2 Tipos de Atualização

| Tipo | Onde Adicionar | Quando Usar |
|------|----------------|-------------|
| **Stability Rule** | Seção dedicada | Regras para evitar crashes |
| **Anti-Pattern** | Seção existente | Padrões problemáticos |
| **Known Case** | `references/` | Casos complexos documentados |
| **Quick Reference** | Tabela existente | Dicas rápidas |

---

## 5. APRIMORAR AGENTS.md

### 5.1 Selecionar Arquivos

Com base nos arquivos modificados, sugerir AGENTS.md relevantes:

| Arquivo Modificado | AGENTS.md Alvo |
|--------------------|----------------|
| `apps/api/src/routers/*.ts` | `apps/api/src/AGENTS.md` |
| `apps/api/drizzle/schema.ts` | `apps/api/drizzle/AGENTS.md` |
| `apps/web/src/components/*.tsx` | `apps/web/src/AGENTS.md` |
| `packages/ai-gateway/*` | `packages/ai-gateway/AGENTS.md` |

### 5.2 Template de Atualização

Adicionar seção ao AGENTS.md selecionado:

```markdown
### [Data: YYYY-MM-DD] [Título do Aprendizado]

> Adicionado após correção de bug em `[arquivo]`.

**Problema:** [Descrição]
**Causa:** [Root cause]
**Solução:** [Fix aplicado]

```typescript
// ❌ EVITAR
[código problemático]

// ✅ PADRÃO CORRETO
[código correto]
```
```

---

## 6. SINCRONIZAR COM NOTEBOOKLM (Opcional)

Se o usuário tiver NotebookLM configurado:

```typescript
notebooklm_notebook_add_text({
  notebook_id: "42457101-fb22-4c94-819a-42c3ba5cb0c5",
  title: `Fix - ${slug}`,
  content: `## Problema
[descrição]

## Root Cause
[causa]

## Solução
[fix]

## Validação
[bun run check + lint:check + test]`,
});
```

---

## 7. RESUMO FINAL

```
✅ Aprendizado capturado com sucesso!

📚 Memória: evolution-core atualizado
🔧 Skills aprimoradas: [lista]
📄 AGENTS.md atualizados: [lista]

Para ver histórico: python3 .claude/skills/evolution-core/scripts/memory_manager.py stats
```

---

## Referências

- **evolution-core**: `.claude/skills/evolution-core/SKILL.md`
- **skill-creator**: `.claude/skills/skill-creator/SKILL.md`
- **NotebookLM**: `.claude/skills/planning/SKILL.md`
