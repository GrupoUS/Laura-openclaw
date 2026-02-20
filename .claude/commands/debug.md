---
description: Debug workflow com investigacao paralela multi-agente e metodologia sistematica
---

# /debug - Debug com Agent Team Paralelo

**ARGUMENTS**: $ARGUMENTS

---

## 0. IRON LAW (NUNCA VIOLAR)

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

Se voce nao completou a Fase 1, voce NAO PODE propor correcoes.

---

## 1. PRIMEIRA ACAO: Invocar Skill

```typescript
Skill("debugger")  // Metodologia de 4 fases + Iron Law
```

Isso carrega a metodologia de 4 fases e o Iron Law de verificacao.

---

## 2. FASE 0: Coletar Erros (SEMPRE PRIMEIRO)

### Erros Locais
```bash
bun run check 2>&1 | tail -30
bun run lint:check 2>&1 | tail -30
bun test 2>&1 | tail -30
```

### Erros CI/CD
```bash
gh run list --repo GrupoUS/neondash -L 5
gh run view --log-failed
```

---

## 3. FASE 1: Investigacao Paralela Multi-Agente (PADRAO)

### 3.1 Criar Team de Investigacao

```typescript
TeamCreate({
  team_name: "debug-{slug}",
  description: "Investigar: $ARGUMENTS"
})
```

### 3.2 Mapear Camadas Afetadas

| Camada | Agente | O que investiga |
|--------|--------|-----------------|
| Frontend/UI | `frontend-specialist` | Componentes, estado, hooks, eventos |
| Backend/API | `backend-specialist` | tRPC, procedures, middleware, queries |
| Database | `database-architect` | Schema, locks, queries lentas, indices |
| Auth/Security | `security-auditor` | Clerk, tokens, permissoes, RBAC |

### 3.3 Spawnar Agentes em Paralelo

```typescript
// SEMPRE spawnar em paralelo para investigacao simultanea
Task({
  subagent_type: "backend-specialist",
  description: "Investigar backend",
  prompt: `TASK: Investigar bug no backend

CONTEXTO: $ARGUMENTS

SUA MISSAO:
1. Ler os arquivos relevantes do backend
2. Identificar onde o fluxo pode estar quebrando
3. Verificar queries, mutations, procedures
4. Procurar erros silenciosos ou excecoes nao tratadas
5. Identificar possiveis race conditions

RETORNE:
- Arquivos analisados com numeros de linha
- Codigo especifico que pode ser problematico
- Hipotese de root cause
- NAO PROJUA CORRECOES AINDA`,
  run_in_background: true
})

Task({
  subagent_type: "debugger",
  description: "Trace fluxo completo",
  prompt: `TASK: Trace completo do fluxo

CONTEXTO: $ARGUMENTS

SUA MISSAO:
1. Mapear o fluxo completo do usuario ate o erro
2. Identificar exatamente ONDE o fluxo para
3. Verificar se sao eventos perdidos, estado travado, ou erro silencioso
4. Comparar comportamento esperado vs atual

RETORNE:
- Fluxo passo a passo com arquivos e linhas
- Ponto exato onde diverge
- Hipotese de root cause
- NAO PROJUA CORRECOES AINDA`,
  run_in_background: true
})

Task({
  subagent_type: "database-architect",
  description: "Analisar estado DB",
  prompt: `TASK: Analisar estado do banco

CONTEXTO: $ARGUMENTS

SUA MISSAO:
1. Verificar schema relevante
2. Procurar locks orfaos ou stale
3. Verificar constraints que podem causar falhas
4. Identificar queries que podem travar

RETORNE:
- Tabelas/campos relevantes
- Possiveis problemas de lock/concorrencia
- Queries SQL de diagnostico
- NAO PROJUA CORRECOES AINDA`,
  run_in_background: true
})
```

---

## 4. ENQUANTO AGENTES RODAM: Investigacao Paralela

**NAO espere passivamente.** Enquanto agentes investigam, faca:

1. **Leia os arquivos principais voce mesmo**
2. **Trace o fluxo de dados mentalmente**
3. **Identifique padroes similares que funcionam**
4. **Formule hipoteses iniciais**

### Arquivos Comuns para Verificar

```
Frontend: hooks/, components/, pages/
Backend: routers/, services/, _core/
Database: drizzle/schema.ts
```

---

## 5. FASE 2: Consolidar Hipoteses

Quando agentes completarem:

1. **Leia todos os relatorios**
2. **Identifique convergencia** - onde 2+ agentes acharam o mesmo problema
3. **Forme HIPOTESE PRINCIPAL**
4. **Liste hipoteses alternativas**

### Template de Consolidacao

```markdown
## Hipotese Principal
[Descricao clara do root cause]

## Evidencia
- Agente 1 achou: ...
- Agente 2 achou: ...
- Eu achei: ...

## Linha(s) Critica(s)
- arquivo.ts:123 - [problema especifico]

## Hipoteses Alternativas
1. [Hipotese 2]
2. [Hipotese 3]
```

---

## 6. FASE 3: Implementar Correcao (UMA POR VEZ)

### 6.1 Regras de Ouro

- **UMA correcao por vez**
- **Corrigir no SOURCE, nao no sintoma**
- **NUNCA "enquanto estou aqui..."**
- **Testar apos CADA correcao**

### 6.2 Aplicar Correcao

```typescript
// Fazer a menor mudanca possivel
Edit({ file_path: "...", old_string: "...", new_string: "..." })
```

### 6.3 Verificar Imediatamente

```bash
bun run check && bun run lint:check
```

---

## 7. FASE 4: Quality Gates

### APOS CADA correcao:

```bash
bun run check       # TypeScript
bun run lint:check  # Biome (format) + OXLint (lint)
bun test            # Tests
```

### Se falhar:
- **NAO adicione mais correcoes**
- **Analise o erro**
- **Volte para Fase 1 se necessario**

---

## 8. CLEANUP: Finalizar Team

```typescript
// Desligar agentes
SendMessage({ type: "shutdown_request", recipient: "backend-specialist", ... })
SendMessage({ type: "shutdown_request", recipient: "debugger", ... })
SendMessage({ type: "shutdown_request", recipient: "database-architect", ... })

// Marcar tarefas completas
TaskUpdate({ taskId: "1", status: "completed" })
TaskUpdate({ taskId: "2", status: "completed" })
TaskUpdate({ taskId: "3", status: "completed" })

// Deletar team
TeamDelete()
```

---

## 9. Matrix de Agentes por Tipo de Bug

| Bug Type | Primary Agent | Parallel Agents |
|----------|---------------|-----------------|
| API/tRPC error | backend-specialist | debugger, database-architect |
| UI stuck/broken | frontend-specialist | debugger, backend-specialist |
| Auth/permission | security-auditor | backend-specialist, database-architect |
| Database/lock | database-architect | backend-specialist, debugger |
| Performance | performance-optimizer | backend-specialist, database-architect |
| Deploy/Docker | devops-engineer | backend-specialist |
| Multi-layer (L4+) | TODOS em paralelo | - |

---

## 10. Exemplo de Uso (Real)

```typescript
// Usuario: "sync travado na fase 1"

// 1. Invocar skill
Skill("debugger")

// 2. Criar team
TeamCreate({ team_name: "debug-sync-stuck" })

// 3. Spawnar agentes em paralelo
Task({ subagent_type: "backend-specialist", run_in_background: true, ... })
Task({ subagent_type: "debugger", run_in_background: true, ... })
Task({ subagent_type: "database-architect", run_in_background: true, ... })

// 4. Enquanto roda, investigar voce mesmo
Read("hooks/use-sync-status.ts")
Read("components/unified-sync-button.tsx")
Read("routers/unifiedSync/...")

// 5. Consolidar hipoteses
// "Race condition: subscription enabled AFTER mutation starts"

// 6. Corrigir
Edit({ ... })

// 7. Verificar
bun run check && bun run lint:check && bun test

// 8. Cleanup
SendMessage({ type: "shutdown_request", ... })
TeamDelete()
```

---

## 11. Red Flags - PARAR

**PARAR se voce:**
- Propoe correcao antes de achar root cause
- Faz multiplas mudancas de uma vez
- "So tentar isso e ver"
- Pula verificacao de testes
- Ignora evidencias que contradizem sua hipotese

**Se 3+ correcoes falharam:**
- Questione a arquitetura
- Converse com o usuario
- NAO tente outra correcao

---

## 12. Skills Relacionadas

| Domain | Skill |
|--------|-------|
| Metodologia | `debugger` |
| Backend | `backend-design` |
| Database | `clerk-neon-auth` |
| Frontend | `frontend-rules` |
| Docker | `docker-deploy` |
| Security | `security-audit` |

---

## Referencias

- `.claude/skills/debugger/SKILL.md` - Metodologia detalhada (Iron Law + Verification Gate)
- `.claude/skills/debugger/references/methodology.md` - 4-phase debugging protocol
