---
description: Debug workflow com investigacao paralela multi-agente, auditoria sistematica e analise critica exaustiva
---

# /debug - Debug com Agent Team Paralelo

**ARGUMENTS**: $ARGUMENTS

---

## 0. MODO UNIFICADO (DEBUG + SYSTEMATIC AUDIT + FRONTEND DEBUG + CRITICAL ANALYSIS)

Este comando agora incorpora o antigo `/sistematic-audit`.
O arquivo `/.claude/commands/sistematic-audit.md` foi removido para manter apenas um entrypoint.
O arquivo `/.claude/commands/frontend-debug.md` foi removido e incorporado neste comando.

Selecione o modo por argumento:

- `mode=debug` (default) -> fluxo de debug abaixo
- `mode=systematic-audit` -> auditoria full-stack completa
- `mode=frontend-debug` -> depuracao focada em React/UI e integracao
- `mode=critical-analysis` -> analise critica exaustiva de 7 dimensoes do projeto

Atalhos aceitos para auditoria:

- `audit`
- `systematic-audit`
- `full-audit`

Atalhos aceitos para frontend:

- `frontend-debug`
- `ui-debug`
- `react-debug`

Atalhos aceitos para analise critica:

- `critical-analysis`
- `super-audit`
- `project-review`
- `deep-audit`
- `7d` (7 dimensoes)

### 0.1 Fluxo de Auditoria Incorporado

Se o modo for `systematic-audit`, execute este contrato:

```typescript
Skill("debugger");

Task({
  subagent_type: "debugger",
  run_in_background: true, // Run as background task
  prompt: `Execute Mode B (systematic-audit) from .claude/agents/debugger.md.

Arguments: $ARGUMENTS

Mandatory outputs:
1) .sisyphus/plans/sistematic-audit.md
2) .sisyphus/notepads/sistematic-audit/AUDIT-REPORT.md

Requirements:
- Preserve inventory-first flow
- Keep severity order P0 -> P1 -> P2 -> P3
- Apply one fix at a time
- Run all quality gates with fresh evidence
- Use XML response contract when returning structured plan/report`,
});
```

Compatibilidade preservada:

- Mesmos artefatos de saida
- Mesmo modelo de severidade P0-P3
- Mesmos quality gates finais

### 0.2 Fluxo Frontend Incorporado

Se o modo for `frontend-debug`, execute este contrato:

```typescript
Skill("debugger");

Task({
  subagent_type: "debugger",
  run_in_background: true, // Run as background task
  prompt: `Execute Mode C (frontend-debug) from .claude/agents/debugger.md.

Arguments: $ARGUMENTS

Requirements:
- Require static + visual diagnostic evidence before fix
- Use debugger frontend pack workflow
- Run frontend and backend integration investigation in parallel
- Apply one fix at a time
- Re-validate with browser evidence and shared quality gates`,
});
```

### 0.3 Fluxo de Analise Critica Exaustiva (7 Dimensoes)

Se o modo for `critical-analysis`, execute o contrato descrito na **Secao 14** deste documento.

---

## 0. IRON LAW (NUNCA VIOLAR)

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

Se voce nao completou a Fase 1, voce NAO PODE propor correcoes.

---

## 1. PRIMEIRA ACAO: Invocar Skill

```typescript
Skill("debugger"); // Metodologia de 4 fases + Iron Law
Skill("evolution-core"); // Query de memoria historica (NotebookLM MCP)
```

Isso carrega a metodologia de 4 fases, o Iron Law de verificacao e o fluxo de memoria historica no NotebookLM.

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

### 2.1 Memoria NeonDash (NotebookLM MCP) — OBRIGATORIO antes da Fase 1

**Notebook alvo (NeonDash Memory):**

- `https://notebooklm.google.com/notebook/42457101-fb22-4c94-819a-42c3ba5cb0c5?authuser=1`
- `notebook_id: "42457101-fb22-4c94-819a-42c3ba5cb0c5"`

```typescript
const notebookId = "42457101-fb22-4c94-819a-42c3ba5cb0c5";

const fixedErrors = notebooklm_notebook_query({
  notebook_id: notebookId,
  query: `Liste erros arrumados semelhantes a: $ARGUMENTS. Retorne sintoma, root cause, arquivo(s), fix aplicado e validacao.`,
});

const recurringIssues = notebooklm_notebook_query({
  notebook_id: notebookId,
  conversation_id: fixedErrors.conversation_id,
  query: `Quais problemas recorrentes relacionados a $ARGUMENTS ainda aparecem? Retorne anti-patterns e sinais de alerta.`,
});

const diagnostics = notebooklm_notebook_query({
  notebook_id: notebookId,
  conversation_id: fixedErrors.conversation_id,
  query: `Quais checks de diagnostico funcionaram melhor nos casos anteriores parecidos?`,
});
```

### 2.2 Output minimo esperado da memoria

```markdown
## Memory Context (NotebookLM)

### Erros arrumados relevantes

| Caso | Sintoma | Root Cause | Arquivos | Fix aplicado | Validacao |

### Problemas recorrentes

| Tema | Sinal de alerta | Camada | Como detectar cedo |

### Checks recomendados

- [check 1]
- [check 2]
```

### 2.3 Se NotebookLM falhar (nao bloqueia workflow)

```typescript
// 1) Tentar recarregar cookies existentes
notebooklm_refresh_auth({});

// 2) Se falhar por auth expirada, reautenticar no terminal e recarregar
// notebooklm-mcp-server auth
// notebooklm_refresh_auth({})
```

Se ainda falhar, **continue o debug** com fallback local:

- `gh issue list --state closed --search "$ARGUMENTS"`
- `git log -S "$ARGUMENTS" --oneline`
- `grep` nos docs internos por bugs similares

---

## 3. FASE 1: Investigacao Paralela Multi-Agente (PADRAO)

### 3.1 Criar Team de Investigacao

```typescript
TeamCreate({
  team_name: "debug-{slug}",
  description: "Investigar: $ARGUMENTS",
});
```

### 3.2 Mapear Camadas Afetadas

| Camada        | Agente                  | O que investiga                        |
| ------------- | ----------------------- | -------------------------------------- |
| Frontend/UI   | `debugger`              | Componentes, estado, hooks, eventos    |
| Backend/API   | `debugger`              | tRPC, procedures, middleware, queries  |
| Database      | `debugger`              | Schema, locks, queries lentas, indices |
| Auth/Security | `performance-optimizer` | Clerk, tokens, permissoes, RBAC        |

### 3.3 Spawnar Agentes em Paralelo

```typescript
// SEMPRE spawnar em paralelo para investigacao simultanea
Task({
  subagent_type: "debugger",
  description: "Investigar backend",
  prompt: `TASK: Investigar bug no backend

CONTEXTO: $ARGUMENTS
MEMORIA NOTEBOOKLM: [Cole aqui o resumo de "Erros arrumados", "Problemas recorrentes" e "Checks recomendados"]

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
  run_in_background: true,
});

Task({
  subagent_type: "debugger",
  description: "Trace fluxo completo",
  prompt: `TASK: Trace completo do fluxo

CONTEXTO: $ARGUMENTS
MEMORIA NOTEBOOKLM: [Cole aqui o resumo de "Erros arrumados", "Problemas recorrentes" e "Checks recomendados"]

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
  run_in_background: true,
});

Task({
  subagent_type: "debugger",
  description: "Analisar estado DB",
  prompt: `TASK: Analisar estado do banco

CONTEXTO: $ARGUMENTS
MEMORIA NOTEBOOKLM: [Cole aqui o resumo de "Erros arrumados", "Problemas recorrentes" e "Checks recomendados"]

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
  run_in_background: true,
});
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

- Memoria NotebookLM achou: ...
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
Edit({ file_path: "...", old_string: "...", new_string: "..." });
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
SendMessage({ type: "shutdown_request", recipient: "debugger", ... })
SendMessage({ type: "shutdown_request", recipient: "debugger", ... })
SendMessage({ type: "shutdown_request", recipient: "debugger", ... })

// Marcar tarefas completas
TaskUpdate({ taskId: "1", status: "completed" })
TaskUpdate({ taskId: "2", status: "completed" })
TaskUpdate({ taskId: "3", status: "completed" })

// Deletar team
TeamDelete()

// Persistir aprendizado no NeonDash Memory (quando disponivel)
notebooklm_notebook_add_text({
  notebook_id: "42457101-fb22-4c94-819a-42c3ba5cb0c5",
  title: `Debug Fix - ${slug}`,
  content: `Problema: $ARGUMENTS
Root Cause: ...
Fix: ...
Validacao: bun run check + lint:check + test`,
})
```

---

## 9. Matrix de Agentes por Tipo de Bug

| Bug Type          | Primary Agent         | Parallel Agents                 |
| ----------------- | --------------------- | ------------------------------- |
| API/tRPC error    | debugger              | performance-optimizer                   |
| UI stuck/broken   | debugger              | frontend-specialist (optional)         |
| Auth/permission   | performance-optimizer | debugger                                |
| Database/lock     | debugger              | performance-optimizer                   |
| Performance       | performance-optimizer | debugger                                |
| Deploy/Docker     | debugger              | —                                       |
| Multi-layer (L4+) | TODOS em paralelo     | -                               |

---

## 10. Exemplo de Uso (Real)

```typescript
// Usuario: "sync travado na fase 1"

// 1. Invocar skill
Skill("debugger")

// 2. Criar team
TeamCreate({ team_name: "debug-sync-stuck" })

// 3. Spawnar agentes em paralelo
Task({ subagent_type: "debugger", run_in_background: true, ... })
Task({ subagent_type: "debugger", run_in_background: true, ... })
Task({ subagent_type: "debugger", run_in_background: true, ... })

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

| Domain      | Skill                      |
| ----------- | -------------------------- |
| Metodologia | `debugger`                 |
| Backend     | `debugger`                 |
| Database    | `debugger`                 |
| Frontend    | `debugger`                 |
| Docker      | `docker-deploy`            |
| Security    | `performance-optimization` |

---

## 13. Proximos Passos (Pos-Debug)

Apos resolver o bug com sucesso:

```typescript
// Executar /evolve para capturar aprendizado
Skill("evolution-core");

// Ou usar o comando diretamente
// /evolve
```

O sistema ira:
1. Persistir o aprendizado no evolution-core
2. Sugerir skills/AGENTS.md para aprimorar
3. Documentar anti-patterns descobertos

---

## 14. ANALISE CRITICA EXAUSTIVA — 7 DIMENSOES (mode=critical-analysis)

### 14.0 Visao Geral

Este modo executa uma analise critica exaustiva e profundamente detalhada de todo o projeto, cobrindo 7 dimensoes com observacoes concretas, exemplos extraidos diretamente do codigo-fonte e recomendacoes praticas baseadas nos padroes mais atuais da industria.

**IRON LAW da Analise Critica:**

```
NENHUMA OBSERVACAO SEM EVIDENCIA EXTRAIDA DO CODIGO-FONTE.
NENHUMA RECOMENDACAO SEM REFERENCIA A PADRAO DA INDUSTRIA.
```

### 14.1 Skills e Contexto Obrigatorios

```typescript
// Carregar skills relevantes
Skill("debugger");           // Metodologia de investigacao + Iron Law
Skill("evolution-core");     // Memoria historica para contexto de decisoes passadas
Skill("performance-optimization"); // Metricas de performance e seguranca
```

### 14.2 Classificacao de Severidade

Toda observacao DEVE ser classificada usando este modelo:

| Severidade   | Codigo | Criterio                                                              | Acao Esperada                  |
| ------------ | ------ | --------------------------------------------------------------------- | ------------------------------ |
| **Critico**  | P0     | Crash em producao, vulnerabilidade de seguranca, perda de dados       | Corrigir IMEDIATAMENTE         |
| **Importante** | P1   | Violacao de padrao que causa bugs futuros, debt tecnico estrutural    | Corrigir na proxima sprint     |
| **Moderado** | P2     | Inconsistencia de estilo, code smell, duplicacao sem risco imediato   | Planejar correcao              |
| **Menor**    | P3     | Melhoria de legibilidade, otimizacao marginal, documentacao ausente   | Backlog                        |

### 14.3 Execucao: Spawnar Agentes em Paralelo (7 Dimensoes)

```typescript
// FASE 1: Spawnar 4 agentes em paralelo (agrupamento por afinidade)

// Agente 1: Arquitetura + Organizacao (Dimensoes 1 e 2)
Task({
  subagent_type: "oracle",
  description: "Analise arquitetura e estrutura",
  run_in_background: true,
  prompt: `TASK: Analise Critica — Dimensoes 1 e 2

CONTEXTO: Analise critica exaustiva do projeto NeonDash
ESCOPO OPCIONAL (se fornecido): $ARGUMENTS

## DIMENSAO 1 — ARQUITETURA E PADROES ESTRUTURAIS

Examine a arquitetura adotada no projeto e produza analise detalhada:

1. **Identificacao do padrao arquitetural**: Identifique qual padrao esta sendo seguido
   (MVC, MVVM, Clean Architecture, Hexagonal, Layered, Monolitica, Microsservicos ou outro).
   Cite arquivos e diretorios que evidenciam o padrao.

2. **Consistencia do padrao**: Avalie se o padrao esta sendo aplicado de forma consistente
   em TODOS os modulos. Liste modulos que divergem com arquivo:linha.

3. **Principios SOLID**: Para cada principio, identifique violacoes concretas:
   - S (Single Responsibility): Funcoes/classes com multiplas responsabilidades
   - O (Open/Closed): Codigo que requer modificacao para extensao
   - L (Liskov Substitution): Subtipagem que quebra contratos
   - I (Interface Segregation): Interfaces gordas forcando implementacoes desnecessarias
   - D (Dependency Inversion): Dependencias concretas em vez de abstracoes

4. **DRY**: Identifique duplicacoes de logica entre arquivos. Use grep para patterns
   repetidos em routers/, hooks/, components/.

5. **KISS**: Identifique over-engineering — abstracoes desnecessarias, indirections sem valor.

6. **Separacao de responsabilidades**: Verifique se:
   - Logica de negocio esta vazando para componentes UI
   - Queries de banco estao acopladas a handlers HTTP
   - Validacao esta misturada com transformacao de dados

7. **Inversao de dependencia**: Verifique se camadas superiores dependem de abstracoes
   ou de implementacoes concretas.

8. **Acoplamento entre camadas**: Identifique imports circulares ou dependencias
   que violam a direcao do fluxo (ex: backend importando de frontend).

9. **Contratos entre modulos**: Verifique se existem tipos/interfaces compartilhados
   definidos em packages/shared/ ou se cada modulo define seus proprios tipos.

Referencia de arquivos a analisar:
- apps/api/src/_core/ (core do servidor)
- apps/api/src/routers/ (domain routers)
- apps/web/src/hooks/ (logica de estado)
- apps/web/src/components/ (UI)
- packages/shared/ (contratos compartilhados)

## DIMENSAO 2 — ORGANIZACAO DE PASTAS E ESTRUTURA DO PROJETO

1. **Mapeamento da arvore**: Liste a estrutura completa de diretorios ate 3 niveis
   de profundidade usando list_dir ou Bash ls.

2. **Convencoes de nomenclatura**: Verifique se:
   - Nomes de pastas seguem kebab-case ou camelCase consistentemente
   - Nomes de arquivos seguem a convencao do framework (ex: TanStack Router file-based)
   - Componentes React usam PascalCase
   - Hooks usam use-* ou use* consistentemente
   - Routers usam nomenclatura de dominio consistente

3. **Separacao logica**: Avalie se ha separacao clara entre:
   - Camada de apresentacao (components/, pages/)
   - Logica de negocio (routers/, services/)
   - Acesso a dados (drizzle/)
   - Utilitarios (lib/, utils/)
   - Configuracoes (config/, _core/)
   - Assets (public/)
   - Testes (__tests__/, *.test.ts)

4. **Problemas estruturais**: Identifique:
   - Arquivos orfaos (nao importados por ninguem)
   - Pastas vazias
   - Duplicacoes de estrutura (mesma coisa em dois lugares)
   - Barrel files (index.ts) incompletos ou inconsistentes
   - Arquivos muito grandes (>500 linhas) que deviam ser divididos

RETORNE formato:
Para cada achado:
- Arquivo/diretorio exato
- Descricao do problema
- Severidade (P0/P1/P2/P3)
- Recomendacao com referencia a padrao da industria
- NAO APLIQUE CORRECOES — apenas reporte`,
});

// Agente 2: Qualidade de Codigo (Dimensao 3)
Task({
  subagent_type: "debugger",
  description: "Analise qualidade codigo",
  run_in_background: true,
  prompt: `TASK: Analise Critica — Dimensao 3

CONTEXTO: Analise critica exaustiva do projeto NeonDash
ESCOPO OPCIONAL (se fornecido): $ARGUMENTS

## DIMENSAO 3 — QUALIDADE DO CODIGO-FONTE

Analise a qualidade da escrita do codigo em cada camada do projeto:

### 3.1 Legibilidade e Estilo

- Verifique consistencia de estilo entre arquivos (biome.json + .oxlintrc.json sao referencia)
- Identifique funcoes excessivamente longas (>50 linhas) com arquivo:linha
- Calcule complexidade ciclomatica aproximada de funcoes criticas
- Verifique nomenclatura: variaves, funcoes, classes e interfaces devem ser descritivas

### 3.2 Tipagem TypeScript

- Busque por `as any`, `as unknown`, `!` (non-null assertion) usando grep
- Identifique funcoes sem tipo de retorno explicito em routers e services
- Verifique se Zod schemas estao sendo usados em todas as mutations/queries tRPC
- Busque por `@ts-ignore` ou `@ts-expect-error` sem justificativa
- Verifique conformidade com regras de AGENTS.md Secao 15 (Stability Audit Rules)

### 3.3 Tratamento de Erros

- Verifique se mutations usam TRPCError com codigos corretos (nao Error generico)
- Identifique try-catch vazios ou que apenas fazem console.log
- Verifique se .returning()[0] tem guarda de null (regra AGENTS.md 15C)
- Busque por promises nao awaited (fire-and-forget sem justificativa)
- Verifique se frontend usa try-catch em mutateAsync (regra AGENTS.md 15J)

### 3.4 Codigo Morto e Duplicacao

- Identifique exports nao utilizados (funcoes, tipos, constantes)
- Busque por commented-out code blocks (>3 linhas)
- Identifique funcoes duplicadas entre routers ou entre hooks
- Verifique imports nao utilizados

### 3.5 Seguranca

- Busque por credenciais hardcoded: API keys, tokens, passwords em codigo
- Verifique se .env esta no .gitignore
- Busque por console.log com dados sensiveis (userId, email, tokens)
- Verifique uso de dangerouslySetInnerHTML
- Verifique se links target="_blank" tem rel="noopener" (regra AGENTS.md 15K)
- Verifique CORS config (regra AGENTS.md 15G)

### 3.6 Design Patterns

- Identifique onde patterns sao aplicados corretamente (Repository, Service, Factory, Observer)
- Identifique onde patterns DEVERIAM ser aplicados mas nao sao
- Verifique consistencia: se um padrao e usado em um router, deve ser usado em todos

### 3.7 Conformidade com AGENTS.md

Verifique cada regra da Secao 15 (Stability Audit Rules):
- A: Import/Export completeness (barrel files)
- B: Type Safety (non-null assertions)
- C: Array access guards (.returning())
- D: Auth procedure selection
- E: Global error handlers
- F: Environment configuration
- G: CORS configuration
- H: Console statement removal
- I: Type casting (as any)
- J: Frontend error handling
- K: Dead anchor links
- L: Error boundary security

RETORNE formato:
Para cada achado:
- Arquivo:linha exato
- Trecho de codigo problematico (cite 3-5 linhas)
- Severidade (P0/P1/P2/P3)
- Recomendacao com exemplo de como deveria ser
- Regra violada (SOLID/DRY/AGENTS.md/etc)
- NAO APLIQUE CORRECOES — apenas reporte`,
});

// Agente 3: Documentacao + Paginas Ausentes (Dimensoes 4 e 5)
Task({
  subagent_type: "debugger",
  description: "Analise docs e fluxos ausentes",
  run_in_background: true,
  prompt: `TASK: Analise Critica — Dimensoes 4 e 5

CONTEXTO: Analise critica exaustiva do projeto NeonDash
ESCOPO OPCIONAL (se fornecido): $ARGUMENTS

## DIMENSAO 4 — DOCUMENTACAO

### 4.1 Inventario de Documentacao Existente

Mapeie todos os arquivos de documentacao:
- README.md (raiz e subdiretorios)
- AGENTS.md (raiz e subdiretorios)
- CLAUDE.md
- docs/ directory
- Changelogs
- ADRs (Architecture Decision Records)
- Comentarios JSDoc/TSDoc em codigo

### 4.2 Qualidade da Documentacao

Para cada documento encontrado, avalie:
- Esta atualizado em relacao ao codigo atual?
- E suficiente para um novo dev entender o projeto?
- Contem exemplos praticos de uso?
- Links internos estao funcionando?

### 4.3 Documentacao Ausente

Identifique o que DEVERIA existir mas nao existe:
- Guia de instalacao e setup local (passo a passo)
- Documentacao de API (endpoints, schemas, exemplos)
- Diagramas de arquitetura (ER, fluxo de dados, deployment)
- Guia de contribuicao (CONTRIBUTING.md)
- Documentacao de variaveis de ambiente (alem da tabela em AGENTS.md)
- Runbooks operacionais (deploy, rollback, monitoring)
- Documentacao de decisoes tecnicas (ADRs)

### 4.4 Comentarios no Codigo

- Verifique se funcoes complexas (>30 linhas) tem comentarios explicativos
- Identifique TODOs/FIXMEs/HACKs abandonados
- Verifique se tipos complexos tem JSDoc descritivo
- NAO recomende comentarios obvios — apenas onde a logica nao e auto-explicativa

## DIMENSAO 5 — PAGINAS, TELAS E FLUXOS AUSENTES

### 5.1 Inventario de Rotas Existentes

Mapeie todas as rotas do TanStack Router:
- Leia apps/web/src/routes/ recursivamente
- Liste cada rota com seu componente e funcionalidade

### 5.2 Telas Essenciais Ausentes

Com base no dominio do projeto (Mentorship Performance Dashboard), identifique:

**Telas de erro e estados especiais:**
- [ ] Pagina 404 (Not Found) personalizada
- [ ] Pagina 500 (Server Error) personalizada
- [ ] Pagina 403 (Forbidden/Sem Permissao) personalizada
- [ ] Estado de manutencao (maintenance mode)
- [ ] Fallback de Error Boundary com UX amigavel

**Fluxos de autenticacao:**
- [ ] Tela de recuperacao de senha
- [ ] Confirmacao de email
- [ ] Onboarding de primeiro acesso (wizard/tutorial)
- [ ] Tela de convite de mentorado
- [ ] Tela de sessao expirada

**Paginas institucionais:**
- [ ] Termos de uso
- [ ] Politica de privacidade (LGPD)
- [ ] Pagina de suporte/ajuda/FAQ

**Dashboards e administracao:**
- [ ] Dashboard administrativo (visao global de todos mentorados)
- [ ] Painel de configuracoes do sistema
- [ ] Logs de auditoria/atividade
- [ ] Gerenciamento de planos/assinaturas

**Telas de feedback e confirmacao:**
- [ ] Confirmacao de acoes destrutivas (delete, cancelar assinatura)
- [ ] Tela de sucesso apos onboarding
- [ ] Tela de boas-vindas pos-registro
- [ ] Notificacoes/central de avisos

### 5.3 Fluxos Incompletos

Trace cada fluxo principal do usuario e identifique lacunas:
- Registro -> Onboarding -> Dashboard (algum passo faltando?)
- CRUD de mentorados (todos os estados cobertos?)
- Fluxo de pagamento Stripe (sucesso, falha, webhook)
- Fluxo de integracao WhatsApp/Instagram (estados de erro)
- Fluxo de IA (loading, erro, retry)

RETORNE formato:
Para cada achado:
- Categoria (documentacao/tela/fluxo)
- O que falta (descricao clara)
- Severidade (P0/P1/P2/P3)
- Recomendacao de implementacao
- Referencia a padrao da industria (se aplicavel)
- NAO APLIQUE CORRECOES — apenas reporte`,
});

// Agente 4: UX + Testes/CI (Dimensoes 6 e 7)
Task({
  subagent_type: "frontend-specialist",
  description: "Analise UX e testes",
  run_in_background: true,
  prompt: `TASK: Analise Critica — Dimensoes 6 e 7

CONTEXTO: Analise critica exaustiva do projeto NeonDash
ESCOPO OPCIONAL (se fornecido): $ARGUMENTS

## DIMENSAO 6 — EXPERIENCIA DO USUARIO E MICROINTERACOES

### 6.1 Tooltips e Legendas

- Verifique se campos de formulario tem tooltips/placeholders explicativos
- Verifique se botoes de acao tem tooltips (especialmente icones sem texto)
- Verifique se graficos/charts tem legendas claras
- Verifique se tabelas tem headers descritivos
- Verifique se icones isolados tem textos alternativos ou tooltips

### 6.2 Mensagens de Validacao

- Verifique se formularios tem validacao inline (nao apenas no submit)
- Verifique se mensagens de erro sao contextuais e claras (nao genericas)
- Verifique se campos obrigatorios estao marcados visualmente
- Verifique se ha feedback visual em tempo real (ex: forca de senha)

### 6.3 Estados Vazios e Loading

- Verifique se listas vazias tem orientacao ao usuario (ex: "Nenhum mentorado encontrado. Clique para adicionar.")
- Verifique se ha estados de loading (skeletons, spinners) durante fetches
- Verifique se ha indicadores de progresso para operacoes longas
- Verifique se ha estados de erro com opcao de retry

### 6.4 Navegacao e Orientacao

- Verifique se ha breadcrumbs em paginas internas
- Verifique se ha indicacao de pagina ativa na sidebar/nav
- Verifique se ha feedback visual apos acoes (toasts, alerts)
- Verifique se modais tem botao de fechar e ESC handler

### 6.5 Acessibilidade (a11y)

- Busque por imagens sem alt text (grep para <img sem alt=)
- Verifique se formularios tem <label> associados via htmlFor
- Verifique se ha atributos aria-* em componentes interativos
- Verifique contraste de cores (tokens semanticos vs hardcoded)
- Verifique se ha suporte a navegacao por teclado (tabIndex, onKeyDown)
- Verifique hierarquia de headings (h1 > h2 > h3 sem pular niveis)

### 6.6 Responsividade

- Verifique se layouts usam classes responsivas (sm:, md:, lg:, xl:)
- Identifique componentes que podem quebrar em mobile (<640px)
- Verifique se tabelas grandes tem scroll horizontal ou layout alternativo
- Verifique se modais/dialogs sao usaveis em tela pequena

### 6.7 Consistencia Visual

- Verifique se cores seguem tokens semanticos (bg-primary, text-foreground)
- Busque por cores hardcoded (hex values em className)
- Verifique se espacamento segue escala Tailwind (gap-4, p-6, nao valores arbitrarios)
- Verifique se tipografia e consistente (font sizes, weights)
- Verifique dark mode: todos os componentes funcionam em ambos os temas?

## DIMENSAO 7 — TESTES, CI/CD E QUALIDADE DE ENTREGA

### 7.1 Cobertura de Testes

- Mapeie todos os arquivos .test.ts e .spec.ts
- Liste modulos/routers que NAO tem testes
- Calcule cobertura aproximada: (arquivos com teste / total de arquivos)
- Identifique routers criticos sem testes (auth, pagamento, dados financeiros)

### 7.2 Qualidade dos Testes Existentes

- Verifique se testes tem assertions significativas (nao apenas "nao quebra")
- Identifique testes com .skip ou .only que foram esquecidos
- Verifique se ha testes de integracao (nao apenas unitarios)
- Verifique se ha testes de edge cases (null, vazio, overflow)
- Verifique se mocks sao realistas ou superficiais

### 7.3 Tipos de Teste Ausentes

- [ ] Testes unitarios para servicos/routers criticos
- [ ] Testes de integracao tRPC (procedure -> response)
- [ ] Testes E2E (Playwright/Cypress) para fluxos criticos
- [ ] Testes de acessibilidade automatizados (axe-core)
- [ ] Testes de performance (Lighthouse CI)
- [ ] Testes de contrato de API

### 7.4 Pipeline CI/CD

- Verifique .github/workflows/ para pipelines existentes
- Avalie se pipeline roda: check, lint, test antes de merge
- Verifique se ha deploy automatico (staging, production)
- Verifique se ha branch protection rules
- Identifique steps faltantes:
  - [ ] Type check (bun run check)
  - [ ] Lint (bun run lint:check)
  - [ ] Tests (bun test)
  - [ ] Build (bun run build)
  - [ ] Security audit (npm audit / snyk)
  - [ ] Coverage report
  - [ ] Preview deploy para PRs

### 7.5 Ferramentas de Qualidade

- Verifique configuracao do Biome (biome.json)
- Verifique configuracao do OXLint (.oxlintrc.json)
- Verifique se ha pre-commit hooks (husky, lefthook)
- Verifique se ha analise estatica alem do linter

RETORNE formato:
Para cada achado:
- Categoria (UX/a11y/testes/CI)
- Descricao com evidencia do codigo (arquivo:linha)
- Severidade (P0/P1/P2/P3)
- Recomendacao com exemplo pratico
- NAO APLIQUE CORRECOES — apenas reporte`,
});
```

### 14.4 Enquanto Agentes Rodam: Coleta Propria

**NAO espere passivamente.** Execute em paralelo:

```bash
# Quality gates atuais
bun run check 2>&1 | tail -30
bun run lint:check 2>&1 | tail -30
bun test 2>&1 | tail -30

# Metricas rapidas
find apps/ packages/ -name "*.ts" -o -name "*.tsx" | wc -l  # Total de arquivos
find apps/ packages/ -name "*.test.ts" -o -name "*.spec.ts" | wc -l  # Arquivos de teste
grep -r "as any" apps/ packages/ --include="*.ts" --include="*.tsx" -c  # Contagem as any
grep -r "console\.log" apps/ packages/ --include="*.ts" --include="*.tsx" -c  # Console.logs
grep -r "TODO\|FIXME\|HACK" apps/ packages/ --include="*.ts" --include="*.tsx" -c  # TODOs
```

### 14.5 Consolidacao do Relatorio

Quando TODOS os agentes completarem, consolide em um relatorio unico:

```markdown
# Relatorio de Analise Critica Exaustiva — NeonDash

**Data:** [data atual]
**Escopo:** [escopo analisado ou "Projeto completo"]
**Agentes utilizados:** oracle, debugger, debugger, frontend-specialist

---

## Resumo Executivo

| Dimensao | P0 | P1 | P2 | P3 | Total |
|----------|----|----|----|----|-------|
| 1. Arquitetura | X | X | X | X | X |
| 2. Organizacao | X | X | X | X | X |
| 3. Qualidade Codigo | X | X | X | X | X |
| 4. Documentacao | X | X | X | X | X |
| 5. Telas Ausentes | X | X | X | X | X |
| 6. UX/Microinteracoes | X | X | X | X | X |
| 7. Testes/CI | X | X | X | X | X |
| **TOTAL** | **X** | **X** | **X** | **X** | **X** |

---

## Dimensao 1 — Arquitetura e Padroes Estruturais

### Estado Atual
[Descricao do padrao identificado com evidencias]

### Achados
| # | Severidade | Descricao | Arquivo:Linha | Principio Violado |
|---|-----------|-----------|---------------|-------------------|
| 1 | P0 | [descricao] | [arquivo:linha] | [SOLID/DRY/etc] |

### Recomendacoes
[Como deveria ser, com exemplos de codigo]

---

## Dimensao 2 — Organizacao de Pastas

### Estado Atual
[Arvore de diretorios + avaliacao]

### Achados
| # | Severidade | Descricao | Local | Convencao Violada |
|---|-----------|-----------|-------|-------------------|

### Recomendacoes
[Reorganizacao sugerida]

---

## Dimensao 3 — Qualidade do Codigo-Fonte

### Estado Atual
[Metricas: total arquivos, as any count, console.log count, etc]

### Achados
| # | Severidade | Descricao | Arquivo:Linha | Trecho | Regra |
|---|-----------|-----------|---------------|--------|-------|

### Recomendacoes
[Exemplos de before/after para cada padrao]

---

## Dimensao 4 — Documentacao

### Estado Atual
[Inventario de docs existentes]

### Achados
| # | Severidade | Descricao | O que falta |
|---|-----------|-----------|-------------|

### Recomendacoes
[Templates e conteudo sugerido]

---

## Dimensao 5 — Paginas, Telas e Fluxos Ausentes

### Estado Atual
[Inventario de rotas existentes]

### Achados
| # | Severidade | Tela/Fluxo Ausente | Impacto |
|---|-----------|-------------------|---------|

### Recomendacoes
[Prioridade de implementacao]

---

## Dimensao 6 — UX e Microinteracoes

### Estado Atual
[Avaliacao geral de UX]

### Achados
| # | Severidade | Descricao | Componente | Recomendacao |
|---|-----------|-----------|------------|--------------|

### Recomendacoes
[Exemplos visuais e de codigo]

---

## Dimensao 7 — Testes, CI/CD e Qualidade de Entrega

### Estado Atual
[Cobertura atual, pipeline existente]

### Achados
| # | Severidade | Descricao | Area | Impacto |
|---|-----------|-----------|------|---------|

### Recomendacoes
[Pipeline ideal, testes prioritarios]

---

## Plano de Acao Priorizado

### Fase 1 — Criticos (P0) — Corrigir Imediatamente
| # | Acao | Dimensao | Esforco Estimado |
|---|------|----------|-----------------|

### Fase 2 — Importantes (P1) — Proxima Sprint
| # | Acao | Dimensao | Esforco Estimado |
|---|------|----------|-----------------|

### Fase 3 — Moderados (P2) — Planejar
| # | Acao | Dimensao | Esforco Estimado |
|---|------|----------|-----------------|

### Fase 4 — Menores (P3) — Backlog
| # | Acao | Dimensao | Esforco Estimado |
|---|------|----------|-----------------|
```

### 14.6 Artefatos de Saida Obrigatorios

```
.sisyphus/notepads/critical-analysis/
├── FULL-REPORT.md           # Relatorio completo consolidado
├── dimension-1-architecture.md  # Detalhes da Dimensao 1
├── dimension-2-structure.md     # Detalhes da Dimensao 2
├── dimension-3-code-quality.md  # Detalhes da Dimensao 3
├── dimension-4-documentation.md # Detalhes da Dimensao 4
├── dimension-5-missing-pages.md # Detalhes da Dimensao 5
├── dimension-6-ux.md            # Detalhes da Dimensao 6
├── dimension-7-tests-ci.md      # Detalhes da Dimensao 7
└── ACTION-PLAN.md               # Plano de acao priorizado
```

### 14.7 Quality Gate Final

Apos consolidar o relatorio, valide:

```bash
# O relatorio DEVE ser gerado mesmo que o projeto passe em todos os gates
bun run check       # TypeScript
bun run lint:check  # Biome + OXLint
bun test            # Vitest
```

### 14.8 Persistir no NeonDash Memory

```typescript
notebooklm_notebook_add_text({
  notebook_id: "42457101-fb22-4c94-819a-42c3ba5cb0c5",
  title: `Critical Analysis - ${new Date().toISOString().split("T")[0]}`,
  content: `Analise Critica 7D realizada.
P0: [contagem] | P1: [contagem] | P2: [contagem] | P3: [contagem]
Dimensoes mais criticas: [lista]
Principais achados: [resumo 3-5 linhas]
Plano de acao: [link para .sisyphus/notepads/critical-analysis/ACTION-PLAN.md]`,
});
```

### 14.9 Exemplo de Uso

```bash
# Analise completa do projeto
/debug critical-analysis

# Analise focada em um escopo
/debug critical-analysis escopo=backend
/debug critical-analysis escopo=frontend
/debug critical-analysis escopo=CRM

# Atalhos
/debug deep-audit
/debug 7d
/debug project-review
```

---

## Referencias

- `.claude/skills/debugger/SKILL.md` - Metodologia detalhada (Iron Law + Verification Gate)
- `.claude/skills/debugger/references/methodology.md` - 4-phase debugging protocol
- `.claude/skills/planning/SKILL.md` - Integracao NotebookLM e Crawl4AI no fluxo D.R.P.I.V
- `.claude/skills/planning/references/notebooklm-hooks.md` - Guardas de auth e queries de memoria
- `AGENTS.md` Secao 15 - Stability Audit Rules (referencia para Dimensao 3)
