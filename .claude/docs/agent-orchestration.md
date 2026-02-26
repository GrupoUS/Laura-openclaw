# Agent Orchestration Guide

> Reference: Como usar subagents e agent teams de forma eficiente no NeonDash

> Portabilidade de agentes: para compatibilidade entre OpenCode e Claude, o frontmatter dos arquivos em `.claude/agents/` deve manter apenas `name` e `description`. Regras de skill e execução ficam no corpo markdown.

## Decision Tree

```
Task recebida
├── L1-L2 + 1 layer? → SINGLE AGENT (direct fix)
├── L3 + independent tasks? → SUBAGENTS (parallel)
├── L4-L5 + parallel + no coordination? → SUBAGENTS (swarm)
├── L5+ + 2+ layers + coordination? → AGENT TEAM
└── Default → SINGLE AGENT
```

## Quando Usar Subagents (Paralelo)

### ✅ Use quando:

- Tarefas verdadeiramente independentes
- Diferentes domínios (fix bug A + add feature B)
- Budget consciente (tokens importam)
- L3-L5 complexity
- Operações que produzem muito output (isolar contexto)
- Pesquisa paralela em diferentes áreas

### ❌ Não use quando:

- Tasks compartilham tipos/interfaces
- Uma depende da output de outra
- Coordenação é essencial

### Padrão de Execução Paralela

```typescript
// Múltiplos subagents executando em paralelo (foreground)
Task({
  subagent_type: "debugger",
  name: "research-backend",
  prompt: "Research auth patterns in apps/api/src/routers/",
});

Task({
  subagent_type: "frontend-specialist",
  name: "research-frontend",
  prompt: "Research auth UI patterns in apps/web/src/",
});

// Background (concorrente)
Task({
  subagent_type: "explorer-agent",
  name: "find-db-patterns",
  prompt: "Find all database schemas related to users",
  run_in_background: true,
});
```

## Quando Usar Agent Teams

### ✅ Use quando:

- Feature toca 2+ layers (DB + API + UI)
- Coordenação é essencial
- Pode definir contratos claros
- L6+ complexity
- Precisa de contexto compartilhado entre agents

### ❌ Não use quando:

- Task simples (use single agent)
- Tasks independentes (use subagents)
- Contratos incertos
- Token budget limitado

### Estrutura de Agent Team

```
Orchestrator (lead)
├── Backend-specialist
├── Frontend-specialist
├── Database-architect
├── Debugger (QA + DevOps + Review)
└── Performance-optimizer (Perf + Security + SEO)
```

### Padrão de Execução

```typescript
// Criar equipe
TeamCreate({
  team_name: "feature-payment",
  description: "Team for Stripe payment integration",
});

// Criar tasks
TaskCreate({
  subject: "Database schema for payments",
  owner: "debugger",
});
TaskCreate({
  subject: "API endpoints for payments",
  owner: "debugger",
});
TaskCreate({ subject: "Checkout UI components", owner: "frontend-specialist" });

// Atribuir
TaskUpdate({ taskId: "1", owner: "debugger" });
TaskUpdate({ taskId: "2", owner: "debugger" });
TaskUpdate({ taskId: "3", owner: "frontend-specialist" });

// Agents trabalham em paralelo via task list
// Coordinator monitora progresso via TaskList

// Cleanup
TeamDelete({ team_name: "feature-payment" });
```

## Contract-First (Para Agent Teams)

1. **Definir contratos ANTES** de spawnar agents
2. Contratos = schema DB → API types → UI props
3. Agents trabalham em paralelo com contratos
4. Sem conflitos de interface

### Exemplo de Contrato

```typescript
// database.contract.ts
export const transacoesTable = pgTable("transacoes", {
  id: uuid("id").primaryKey().defaultRandom(),
  mentorado_id: uuid("mentorado_id")
    .references(() => mentorados.id)
    .notNull(),
  stripe_payment_intent_id: text("stripe_payment_intent_id").notNull(),
  amount: integer("amount").notNull(),
  status: transacaoStatusEnum("status").notNull(),
});

// api.contract.ts
export const createPaymentIntent = protectedProcedure
  .input(
    z.object({
      amount: z.number().positive(),
      currency: z.enum(["brl", "usd"]),
    })
  )
  .output(
    z.object({
      clientSecret: z.string(),
      paymentIntentId: z.string(),
    })
  );

// frontend.contract.ts
export interface CheckoutFormProps {
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: Error) => void;
}
```

## Complexidade e Estratégia

| Complexity | Pattern        | Agents | Parallel | Exemplo                |
| ---------- | -------------- | ------ | -------- | ---------------------- |
| L1-L2      | Direct         | None   | N/A      | Bug fix simples        |
| L3         | Subagent       | 1      | No       | Feature single-file    |
| L4-L5      | Subagent Swarm | 2-3    | **YES**  | Multi-file feature     |
| L6-L8      | Agent Team     | 3-5    | **YES**  | Integração multi-layer |
| L9-L10     | Full Swarm     | 5+     | **YES**  | Arquitetura nova       |

## Hooks de Automação

### Eventos Úteis

| Evento          | Quando firing                      |
| --------------- | ---------------------------------- |
| `SubagentStart` | Quando um subagent inicia          |
| `SubagentStop`  | Quando um subagent termina         |
| `PostToolUse`   | Após usar uma tool                 |
| `Stop`          | Quando Claude termina de responder |

### Exemplo: Notificação ao iniciar subagent

```json
{
  "hooks": {
    "SubagentStart": [
      {
        "matcher": "debugger|frontend-specialist",
        "hooks": [
          {
            "type": "command",
            "command": "echo '🔧 Subagent started'"
          }
        ]
      }
    ]
  }
}
```

### Exemplo: Auto-format após Edit/Write

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | xargs bunx ultracite fix"
          }
        ]
      }
    ]
  }
}
```

## Melhores Práticas

### Paralelização

- **SEMPRE** use paralelo para tarefas independentes
- Use `run_in_background: true` para subagents concorrentes
- Para agent teams, tarefas no TaskList podem executar em paralelo

### Contexto

- Subagents preservam contexto isolado
- Agent teams compartilham task list (não contexto)
- Para contexto compartilhado, use contratos escritos

### Memória

- Agents podem ter `memory: project` para persistir aprendizados
- Útil para padrões recorrentes do codebase

### Skills

- Use `skills` em subagents para injetar conhecimento domain
- Subagents não herdam skills do pai - liste explicitamente

## Neondash Agents Disponíveis

| Agent                   | Role                     | Skills                                                                       |
| ----------------------- | ------------------------ | ---------------------------------------------------------------------------- |
| `orchestrator`          | Team Lead                | planning, evolution-core, skill-creator                                      |
| `debugger`              | Backend/API + Debug/QA/DevOps | debugger, meta-api-integration, google-ai-sdk, baileys-integration, docker-deploy |
| `frontend-specialist`   | UI/React                 | debugger, frontend-design@claude-plugins-official, gpus-theme, ui-ux-pro-max |
| `performance-optimizer` | Performance/Security/SEO | performance-optimization                                                     |
| `explorer-agent`        | Discovery                | planning                                                                     |
| `project-planner`       | Plan Synthesis           | planning                                                                     |
| `documentation-writer`  | Technical Documentation  | notion, xlsx                                                                 |
| `mobile-developer`      | Mobile                   | mobile-development, debugger, gpus-theme                                     |
| `oracle`                | Read-Only Consultant     | (reasoning only, no skill binding)                                           |

## Referências

- [Subagents Official Docs](https://code.claude.com/docs/en/sub-agents)
- [Agent Teams Official Docs](https://code.claude.com/docs/en/agent-teams)
- [Hooks Guide](https://code.claude.com/docs/en/hooks-guide)
