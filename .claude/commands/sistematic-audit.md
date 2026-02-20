---
description: Full-stack audit and zero-defect repair — finds and fixes every broken button, orphan component, dead route, silent sync, missing index, and auth bypass across the entire project.
---

# /sistematic-audit — Audit Completo & Reparação Zero-Defeito

**ARGUMENTS**: $ARGUMENTS

**Complexidade:** L10 — Full-stack: UI, tRPC, NeonDB, integrations, sync
**Metodologia:** D.R.P.I.V (Discover → Research → Plan → Implement → Validate)

---

## Missão

Executar um audit completo do projeto NeonDash de uma só vez.
Encontrar e corrigir **toda interação quebrada, todo componente órfão,
toda rota desconectada, todo sync silencioso** — sem necessitar de
pedidos individuais por bug.

Se `$ARGUMENTS` contém bugs conhecidos, usá-los como **ponto de partida mínimo**.
O audit deve encontrar e corrigir TODOS os problemas similares no projeto inteiro.

---

## 0. IRON LAW

```
NENHUMA CORREÇÃO SEM INVENTÁRIO PRIMEIRO
```

Não corrija nada até completar a Fase 1 (Research).

---

## 1. BOOTSTRAP: Carregar Skills

```typescript
Skill("super-audit")          // Checklists + grep patterns + 5 fases
Skill("frontend-rules")       // Tokens GPUS, componentes, shadcn
Skill("backend-design")       // tRPC, Drizzle, auth patterns
Skill("clerk-neon-auth")      // Schema, FK indexes, RBAC
```

Ler `super-audit/references/grep-patterns.md` — contém todos os comandos prontos.
Ler `super-audit/references/audit-checklists.md` — contém checklists por categoria.

---

## 2. FASE 1 — RESEARCH: Inventário Completo (PARALELO)

> Rodar todos os grupos em paralelo. Cada grupo é independente.

---

### [GRUPO A] Frontend Audit

```typescript
Task({
  subagent_type: "frontend-specialist",
  run_in_background: true,
  prompt: `CARREGAR: Skill("super-audit") + Skill("frontend-rules")

  INVENTARIAR (apps/web/src):
  1. Todas as páginas: find apps/web/src -name "*.tsx" -path "*/pages/*"
  2. Todos os componentes interativos: grep -rn "onClick|onSubmit" apps/web/src --include="*.tsx"
  3. Todos os modais/sheets/drawers: grep -rn "<Dialog|<Sheet|<Drawer|<Modal" apps/web/src --include="*.tsx"
  4. Todos os useState de open/modal: grep -rn "useState.*open\|useState.*modal\|useState.*sheet" apps/web/src --include="*.tsx"

  PARA CADA BOTÃO INTERATIVO:
  - onClick → chama qual handler? → handler faz o quê?
  - Se abre modal: modal está renderizado no JSX? open prop conectado?
  - Se chama mutation: mutation existe no backend?

  PARA CADA MODAL/SHEET/DRAWER:
  - open prop ligado a qual useState? → setter chamado por qual botão?
  - Conteúdo renderiza com dados? → dados podem ser null quando abre?

  PRODUZIR TABELA:
  | Arquivo | Linha | Elemento | Handler | Abre Quê | Problema |

  EXECUTAR grep-patterns.md Fase 4 (Frontend patterns)

  RETORNE:
  - Tabela completa de interações
  - Lista de componentes órfãos (importados em lugar nenhum)
  - Lista de dead anchor links (href="#X" sem id="X")
  - NÃO CORRIJA NADA AINDA`
})
```

---

### [GRUPO B] Backend & tRPC Audit

```typescript
Task({
  subagent_type: "backend-specialist",
  run_in_background: true,
  prompt: `CARREGAR: Skill("super-audit") + Skill("backend-design")

  INVENTARIAR (apps/api/src):
  1. Todos os routers: grep -rn "createTRPCRouter\|router\|\.query\|\.mutation" apps/api/src/routers --include="*.ts"
  2. Todas as procedures: nome, tipo (query/mutation), input schema, auth level

  CROSS-REFERENCE FRONTEND→BACKEND:
  - grep -rn "api\.\|trpc\.\|useMutation\|useQuery" apps/web/src --include="*.tsx"
  - Para cada chamada no frontend: procedure existe no backend? Input match?
  - FLAGEAR toda chamada a procedure inexistente

  EXECUTAR grep-patterns.md Fase 2 (Backend patterns):
  - Test endpoints sem NODE_ENV guard
  - Localhost fallbacks
  - console.log em produção
  - Webhook handlers sem signature verification
  - Procedures sem auth

  RETORNE:
  - Inventário completo de procedures
  - Tabela de cross-reference frontend↔backend
  - Lista de procedures fantasma (chamadas mas não existem)
  - Lista de auth bypass
  - NÃO CORRIJA NADA AINDA`
})
```

---

### [GRUPO C] Database Audit

```typescript
Task({
  subagent_type: "database-architect",
  run_in_background: true,
  prompt: `CARREGAR: Skill("super-audit") + Skill("clerk-neon-auth")

  INVENTARIAR (apps/api/drizzle):
  1. Todas as tabelas: grep -rn "pgTable" apps/api/drizzle/schema*.ts
  2. Todas as FKs: grep -rn ".references(" apps/api/drizzle/schema*.ts
  3. Todos os indexes: grep -rn "index(" apps/api/drizzle/schema*.ts
  4. Relations: grep -rn "relations(" apps/api/drizzle/relations.ts

  FK INDEX AUDIT (NÃO-NEGOCIÁVEL):
  - Para CADA coluna FK → existe index correspondente? SIM/NÃO
  - Produzir tabela: | Tabela | FK Column | References | Index Existe? |
  - ANTES de flagar, verificar se o index já existe (grep pelo nome)

  SCHEMA CONSISTENCY:
  - Zod schemas nos webhooks match colunas do DB?
  - roleEnum cobre todos os valores escritos no código?
  - relations.ts importa apenas de schemas que existem?

  EXECUTAR:
  - bun run db:push (verificar se passa)

  RETORNE:
  - Tabela de FK index coverage
  - Lista de schema mismatches
  - Status do db:push
  - NÃO CORRIJA NADA AINDA`
})
```

---

### [GRUPO D] Sync & Integrations Audit

```typescript
Task({
  subagent_type: "integration-specialist",
  run_in_background: true,
  prompt: `INVENTARIAR:
  1. Todos os botões de sync: grep -rn "sync\|sincronizar\|refresh" apps/web/src --include="*.tsx" -i
  2. Todos os webhook handlers: find apps/api/src -name "*.ts" | xargs grep -l "webhook" 2>/dev/null

  PARA CADA BOTÃO DE SYNC — trace completo:
  Step 1: onClick → chama qual mutation?
  Step 2: mutation existe? → tem try/catch?
  Step 3: botão mostra loading (isPending)? → desabilita durante execução?
  Step 4: sucesso → mostra toast? → dados atualizam (invalidate)?
  Step 5: erro → mostra toast com mensagem legível?

  PARA CADA WEBHOOK:
  - Signature verification existe?
  - Retorna 200 para eventos não tratados?
  - Idempotência (upsert vs insert)?

  RETORNE:
  - Tabela de sync buttons com status de cada step
  - Tabela de webhook handlers com checklist
  - NÃO CORRIJA NADA AINDA`
})
```

---

## 3. ENQUANTO AGENTES RODAM: Investigação Própria

**NÃO espere passivamente.** Execute os comandos do `super-audit` Fase 1:

```bash
bun run check 2>&1 | tail -30
bun run lint:check 2>&1 | tail -30
bun run build 2>&1 | tail -20
```

Trace os bugs conhecidos de `$ARGUMENTS` você mesmo.

---

## 4. FASE 2 — PLAN: Fix Registry

Quando TODOS os agentes completarem:

### 4.1 Compilar Fix Registry

Juntar findings de todos os grupos num único documento:

**Output:** `.sisyphus/plans/sistematic-audit.md`

```markdown
## Fix Registry — NeonDash Systematic Audit

| # | Severity | Category | File:Line | Issue | Root Cause | Fix Summary |
|---|----------|----------|-----------|-------|------------|-------------|

Total CRITICAL: X | HIGH: X | MEDIUM: X | LOW: X
```

**Severidade:**
- **P0 CRITICAL** — Feature completamente quebrada, ação do usuário não produz resultado
- **P1 HIGH** — Feature parcialmente quebrada, experiência degradada
- **P2 MEDIUM** — Falta feedback UX, loading states, error messages
- **P3 LOW** — Componentes órfãos, indexes faltando, console.log

### 4.2 Pre-Mortem (Anti-Regressão)

| # | Risco | Mitigação |
|---|-------|-----------|
| 1 | Fix introduz regressão TypeScript | `bun run check` após CADA fix |
| 2 | Fix de dialog quebra outro dialog na mesma página | Testar todos os dialogs da página |
| 3 | Remoção de órfão deleta componente usado em outro lugar | `grep` por todos os usos antes de deletar |
| 4 | Fix de sync quebra idempotência | Usar upsert (onConflictDoUpdate) |

### 4.3 Apresentar ao Usuário

Antes de implementar, apresentar o Fix Registry com opções:

1. **Auto-fix all** — Fases 3+4 automáticas
2. **Review first** — Esperar aprovação antes de corrigir
3. **Fix only P0** — Corrigir apenas CRITICAL, pausar para review

---

## 5. FASE 3 — IMPLEMENT: Executar Correções

> Ordem: P0 → P1 → P2 → P3. UMA correção por vez. NUNCA batch.

### Padrão de Execução (Repetir para CADA fix)

```
1. LER o arquivo alvo completamente (nunca editar às cegas)
2. Identificar root cause exato
3. Escrever fix mínimo (código completo, sem placeholders)
4. bun run check → deve passar
5. bun run lint:check → deve passar
6. Testar UI: clicar no elemento corrigido, verificar que funciona
7. git commit -m "fix(audit): [Fix #N] descrição"
8. Próximo fix
```

### Template de Fix

```markdown
### Fix #N: [Nome do Issue]
**File:** `path/to/file.tsx:LINE`
**Severity:** P0/P1/P2/P3
**Root Cause:** [Uma frase explicando por que está quebrado]
**Before:** [código quebrado]
**After:** [código corrigido completo]
**Validation:** clicar X → Y acontece
```

### Padrões de Fix Comuns

#### Botão que não faz nada (Modal não abre)
```tsx
// Verificar: useState existe? Dialog renderizado? open prop conectado?
const [isOpen, setIsOpen] = useState(false)
<Button onClick={() => setIsOpen(true)}>Ação</Button>
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>...</DialogContent>
</Dialog>
```

#### Sync sem feedback
```tsx
const mutation = api.router.sync.useMutation({
  onSuccess: (data) => {
    toast({ title: "Sync concluído", description: `${data.count} registros` })
    utils.router.getAll.invalidate()
  },
  onError: (error) => {
    toast({ title: "Falha no sync", description: error.message, variant: "destructive" })
  },
})
<Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
  {mutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sincronizando...</> : "Sincronizar"}
</Button>
```

#### FK Index faltando
```typescript
// No extras da tabela:
fkColumnIdx: index("table_column_idx").on(table.columnName),
```

---

## 6. FASE 4 — VALIDATE: Verificação Final

### 6.1 Build Gates

```bash
bun run check       # TypeScript — 0 errors
bun run lint:check  # Biome (format) + OXLint (lint)
bun test            # Vitest — all passing
bun run build       # Vite — success
bun run db:push     # Drizzle — success
```

### 6.2 UI Checklist Manual

Para **cada página tocada**:
- [ ] Navegar até a página — carrega sem erros
- [ ] Clicar CADA botão — ação acontece
- [ ] Abrir CADA modal/sheet — renderiza conteúdo
- [ ] Submeter CADA form — dados salvam + toast aparece
- [ ] Clicar CADA sync — loading + resultado + feedback
- [ ] DevTools Console — 0 erros não tratados
- [ ] DevTools Network — 0 requests falhando (4xx/5xx)

### 6.3 Audit Report Final

**Output:** `.sisyphus/notepads/sistematic-audit/AUDIT-REPORT.md`

```markdown
# Audit Report — {DATA}

## Resumo
- Total encontrados: X
- P0 corrigidos: X/X
- P1 corrigidos: X/X
- P2 corrigidos: X/X
- P3 corrigidos: X/X

## Issues Corrigidos
| # | Issue | File | Fix | Verificado |

## Issues Restantes (se houver)
| # | Issue | Razão | Próximo Passo |

## Build: ✓ check + lint + test + build + db:push
```

---

## 7. Quality Gates (OBRIGATÓRIOS)

```bash
# Após CADA fix individual:
bun run check && bun run lint:check

# Após TODOS os fixes:
bun run check && bun run lint:check && bun test && bun run build
```

**Red Flags — PARAR:**
- Propor fix antes de inventariar
- Múltiplas mudanças de uma vez
- "Só tentar isso e ver"
- Ignorar evidência que contradiz hipótese
- 3+ fixes falharam → questionar a arquitetura

---

## 8. Skills Relacionadas

| Domínio | Skill | Quando |
|---------|-------|--------|
| Audit core | `super-audit` | Checklists + grep patterns |
| Frontend | `frontend-rules` | Tokens GPUS, componentes |
| Backend | `backend-design` | tRPC, middleware, auth |
| Database | `clerk-neon-auth` | Schema, indexes, RBAC |
| Security | `security-audit` | OWASP, CORS, webhooks |
| Performance | `performance-optimization` | Rodar DEPOIS do audit |
| Debug | `debugger` | Se fix introduz regressão |

---

## Referências

- `.claude/skills/super-audit/SKILL.md` — 5 fases do audit
- `.claude/skills/super-audit/references/grep-patterns.md` — Comandos prontos
- `.claude/skills/super-audit/references/audit-checklists.md` — Checklists detalhados
- `.claude/skills/performance-optimization/SKILL.md` — Rodar após audit
