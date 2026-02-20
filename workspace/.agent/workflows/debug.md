---
title: Debug
description: Debug workflow com investigação paralela sistemática e metodologia root-cause-first
---

# /debug — Debug Sistemático

**ARGUMENTS**: $ARGUMENTS

---

## 0. IRON LAW (NUNCA VIOLAR)

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

Se você não completou a Fase 1, você NÃO PODE propor correções.

---

## 1. PRIMEIRA AÇÃO: Carregar Skill

Antes de qualquer investigação, carregue o skill de debugging:

```
view_file → ~/.gemini/antigravity/skills/debugger/SKILL.md
```

Isso carrega a metodologia de 4 fases.

---

## 2. FASE 0: Coletar Erros (SEMPRE PRIMEIRO)

Execute estes comandos em **paralelo** para coletar todos os erros:

### Erros Locais
```bash
bun run check 2>&1 | tail -30
bun run lint:check 2>&1 | tail -30
bun test 2>&1 | tail -30
```

### Erros CI/CD (se aplicável)
```bash
gh run list --repo GrupoUS/neondash -L 5
gh run view --log-failed
```

### Erros VPS (se aplicável)
```bash
ssh root@31.97.170.4 "docker logs app --tail 100 2>&1 | grep -i error"
```

---

## 3. FASE 1: Investigação Paralela (PADRÃO)

### 3.1 Mapear Camadas Afetadas

| Camada | Ferramentas | O que investigar |
|--------|-------------|-----------------|
| Frontend/UI | `grep_search`, `view_file` em `hooks/`, `components/`, `pages/` | Estado, hooks, eventos, renders |
| Backend/API | `grep_search`, `view_file` em `routers/`, `services/`, `_core/` | tRPC, procedures, middleware |
| Database | `view_file` em `drizzle/schema.ts`, `run_command` para SQL | Schema, locks, queries lentas |
| Auth/Security | `grep_search` em auth patterns, Clerk config | Tokens, permissões, RBAC |

### 3.2 Investigar em Paralelo

Use **parallel tool calls** para investigar múltiplas camadas simultaneamente:

```
# Exemplo: Bug no sync

# Chamadas paralelas:
1. grep_search → "syncLock" em apps/api/src/
2. view_file_outline → apps/api/src/routers/unified-sync-router.ts
3. grep_search → "useSyncStatus" em apps/web/src/
4. view_file → apps/api/drizzle/schema.ts (tabelas relevantes)
```

### 3.3 Para Cada Camada, Buscar

1. **Ler os arquivos relevantes** — `view_file`, `view_file_outline`
2. **Buscar padrões de erro** — `grep_search` por mensagens de erro, throw, catch
3. **Traçar o fluxo de dados** — seguir de entrada até saída
4. **Identificar divergência** — onde comportamento esperado ≠ atual

---

## 4. ENQUANTO INVESTIGA: Reflexão Ativa

**NÃO investigue passivamente.** Enquanto lê arquivos:

1. **Trace o fluxo de dados mentalmente**
2. **Identifique padrões similares que funcionam**
3. **Formule hipóteses iniciais**
4. **Use `mcp_sequential-thinking_sequentialthinking`** para problemas complexos

### Arquivos Comuns para Verificar

```
Frontend: hooks/, components/, pages/
Backend:  routers/, services/, _core/
Database: drizzle/schema.ts
Config:   .env, package.json, tsconfig.json
```

---

## 5. FASE 2: Consolidar Hipóteses

Após investigação completa:

1. **Revisar todas as evidências encontradas**
2. **Identificar convergência** — onde 2+ evidências apontam o mesmo problema
3. **Formar HIPÓTESE PRINCIPAL**
4. **Listar hipóteses alternativas**

### Template de Consolidação

```markdown
## Hipótese Principal
[Descrição clara do root cause]

## Evidência
- Arquivo 1: linha X — [problema específico]
- Arquivo 2: linha Y — [problema específico]
- Logs: [mensagem relevante]

## Linha(s) Crítica(s)
- arquivo.ts:123 — [problema específico]

## Hipóteses Alternativas
1. [Hipótese 2]
2. [Hipótese 3]
```

---

## 6. FASE 3: Implementar Correção (UMA POR VEZ)

### 6.1 Regras de Ouro

- **UMA correção por vez**
- **Corrigir no SOURCE, não no sintoma**
- **NUNCA "enquanto estou aqui..."**
- **Testar após CADA correção**

### 6.2 Aplicar Correção

Use `replace_file_content` ou `multi_replace_file_content` para a menor mudança possível.

### 6.3 Verificar Imediatamente

```bash
bun run check && bun run lint:check
```

---

## 7. FASE 4: Quality Gates

### APÓS CADA correção:

```bash
bun run check       # TypeScript
bun run lint:check  # Biome
bun test            # Tests
```

### Se falhar:

1. **NÃO adicione mais correções**
2. **Analise o erro**
3. **Volte para Fase 1 se necessário**

---

## 8. Matrix de Investigação por Tipo de Bug

| Bug Type | Camada Primária | Investigação Paralela |
|----------|----------------|-----------------------|
| API/tRPC error | Backend (`routers/`) | DB schema, Frontend calls |
| UI stuck/broken | Frontend (`components/`, `hooks/`) | Backend responses |
| Auth/permission | Auth config, middleware | Backend, DB roles |
| Database/lock | Schema, queries | Backend transactions |
| Performance | Profiling, queries | Frontend renders, DB indexes |
| Deploy/Docker | Dockerfile, CI config | Env vars, health checks |
| Multi-layer | TODAS em paralelo | — |

---

## 9. Red Flags — PARAR

**PARAR se você:**
- Propõe correção antes de achar root cause
- Faz múltiplas mudanças de uma vez
- "Só tentar isso e ver"
- Pula verificação de testes
- Ignora evidências que contradizem sua hipótese

**Se 3+ correções falharam:**
- Questione a arquitetura
- Use `notify_user` para conversar com o usuário
- NÃO tente outra correção

---

## 10. Skills Relacionadas

| Domain | Skill | Path |
|--------|-------|------|
| Debugging | `debugger` | `~/.gemini/antigravity/skills/debugger/SKILL.md` |
| Backend | `backend-design` | `~/.gemini/antigravity/skills/backend-design/SKILL.md` |
| Database | `clerk-neon-auth` | `~/.gemini/antigravity/skills/clerk-neon-auth/SKILL.md` |
| Frontend | `frontend-rules` | `~/.gemini/antigravity/skills/frontend-rules/SKILL.md` |
| Docker | `docker-deploy` | `~/.gemini/antigravity/skills/docker-deploy/SKILL.md` |
| Security | `security-audit` | `~/.gemini/antigravity/skills/security-audit/SKILL.md` |
| Full Audit | `super-audit` | `~/.gemini/antigravity/skills/super-audit/SKILL.md` |

> **Regressão pós-feature?** Use `/sistematic-audit` em vez de `/debug` para auditoria completa multi-camada.

---

## Referências

- `~/.gemini/antigravity/skills/debugger/SKILL.md` — Metodologia detalhada
- `~/.gemini/antigravity/skills/super-audit/SKILL.md` — Auditoria completa pós-feature
- `/sistematic-audit` workflow — Audit + Fix Registry + Quality gates em 4 fases
- `/implement` workflow — Para aplicar correções complexas
- `/plan` workflow — Se precisar replanejar a abordagem
