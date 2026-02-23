# Prompt de Engenharia Front-end: Dash Agents & Orchestration

**Objetivo:** Aprimorar o dashboard (rotas `/dash-agents` e `/orchestration`) para refletir a estrutura hierárquica completa dos agentes (conforme definido em `AGENTS.md`), habilitar sincronização em tempo real (via SSE) e exibir skills disponíveis e logs de atividades precisos para cada agente.

## 1. Unificação da Hierarquia (AGENTS.md)
O backend (`src/server/routers/orchestration.ts`) já expõe a query `hierarchy` mapeando os relacionamentos `reportsTo` e extraindo `skills`.
- **Modificar `AgentCard.tsx`**:
  - Exibir a quem o agente reporta (ex: `Reporta a: @laura`).
  - Mostrar o "Role" do agente capturado do `AgentNode` (ex: `Head de Vendas`).
  - O avatar/emoji deve refletir o cargo caso configurado, e as cores devem ficar destacadas de acordo com o nível hierárquico (Level 0, 1, 2, 3).
- **Modificar `OrchestrationDashboard.tsx`**:
  - Garantir que a árvore visual utilize os dados `reportsTo` do `hierarchy` para desenhar os squads corretamente, ao invés de hardcodar a hierarquia visual.

## 2. Sincronização em Tempo Real (SSE vs tRPC Polling)
O frontend já possui um hook `useTaskEvents.ts` que escuta eventos SSE (Server-Sent Events) como `agent:status`, `agent:skill_used`, `task:updated`.
- Atualmente, as páginas `/dash-agents` e `/orchestration` utilizam tRPC com `refetchInterval: 10000`, o que causa atrasos (polling de 10s).
- **Instruções:**
  - Reduzir a dependência exclusiva do tRPC Polling para a reatividade principal.
  - Certificar-se de que os estados de `liveAgentMap` e `activityLog` do `useTaskStore` (alimentados via SSE) re-renderizem os componentes imediatamente.
  - No `ActivityFeed.tsx`, já fazemos o merge entre eventos tRPC históricos e os do SSE em memória. Garantir que o limite de exibição e auto-scroll acompanhem novos eventos em `dash-agents`.
  - Exibir o `currentAction` derivado do `LiveAgentState` no `AgentCard` caso ele não esteja atrelado a uma task formal no banco, permitindo observar o "Thinking" do agente ao vivo.

## 3. Exibição de Skills e Ferramentas (Tools)
- **Componente `SkillBadge`**:
  - Aprimorar o highlight de skills em uso (`animate-pulse`).
  - No `AgentCard.tsx`, quando as skills forem expandidas, separar visualmente "Skills Ativas (SSE)" vs "Skills Inativas".
  - Na página `/orchestration`, atualizar o bloco "Skills e Ferramentas" para exibir quais skills estão mapeadas e disponíveis (query `skillsMap`), e alertar (vermelho/laranja) para skills não assinadas a nenhum agente ativo.

## 4. Arquivos Alvo da Refatoração
1. `src/client/routes/dash-agents.tsx`
2. `src/client/routes/orchestration.tsx`
3. `src/client/components/dashboard/agents/AgentCard.tsx`
4. `src/client/components/dashboard/orchestration/OrchestrationDashboard.tsx`
5. `src/client/components/dashboard/agents/ActivityFeed.tsx`

**Resumo da Execução:** Faça o diff destas alterações, garanta que os tipos TypeScript em `shared/types/orchestration.ts` e `tasks.ts` estão alinhados e execute `bun run lint:admin` antes do commit para evitar quebras no Railway.
