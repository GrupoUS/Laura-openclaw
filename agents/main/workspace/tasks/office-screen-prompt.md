# Task #19 — Dashboard: Office Screen (Escritório Digital dos Agentes)

## Contexto
O dashboard do Grupo US (em `/Users/mauricio/.openclaw/dashboard/`) precisa de uma nova
rota `/office` com um escritório digital estilo pixel art onde cada agente da equipe
aparece com seu avatar, área de trabalho e computador.

## Referência Visual
Inspiração: Roman.Knox no Instagram — "The Office" screen com pixel art, personagens
sentados em computadores, ambiente de escritório em perspectiva isométrica.

## Stack
- React 19 + TypeScript
- TanStack Router (file-based routes em `src/client/routes/`)
- tRPC + TanStack Query (dados via `trpc.X.Y.useQuery()`)
- Tailwind CSS 4
- Hono backend em `src/server/`

## Agentes a exibir (com emoji/cor)
| ID | Nome | Emoji | Cor | Tier |
|----|------|-------|-----|------|
| main | Laura | 💜 | purple | Top |
| claudete | Claudete | 🎭 | indigo | Top |
| cris | Cris | 💎 | teal | Top |
| celso | Celso | 📣 | orange | Dir |
| flora | Flora | 🌿 | blue | Dir |
| otto | Otto | ⚙️ | green | Dir |
| mila | Mila | 🌸 | pink | Dir |
| coder | Coder | 💻 | blue | Builder |
| cs | CS | 🎓 | pink | Builder |
| suporte | Suporte | 🗂️ | green | Builder |
| rafa | Rafa | ✍️ | orange | Mkt |
| duda | Duda | 📸 | pink | Mkt |
| maia | Maia | 🎬 | purple | Mkt |
| luca-t | Luca T. | 📊 | yellow | Mkt |
| sara | Sara | 🎯 | green | Mkt |
| malu | Malu | 🤝 | pink | Mkt |
| dora | Dora | 🗺️ | blue | Prod |

## Estados de cada agente
- **active** (verde 🟢) → avatar sentado no computador, tela do PC acesa, animação de digitação
- **standby** (amarelo 🟡) → avatar em pé ao lado da mesa, PC ligado mas sem atividade
- **idle** (cinza ⚫) → cadeira vazia, PC desligado

## Fonte de dados de status
Criar endpoint tRPC `agentOffice.list` no servidor que:
1. Lê sessões ativas do OpenClaw via gateway WebSocket ou REST
2. Retorna array `{ agentId, name, emoji, status, lastActivity, currentTask? }`
3. Auto-refresh a cada 10 segundos

## Layout da tela
```
┌─────────────────────────────────────────────────────────┐
│  THE OFFICE — Grupo US HQ          🟢 4 Working  🟡 3 Idle │
├─────────────────────────────────────────────────────────┤
│                                                           │
│   [Pixel art office floor — isometric or top-down view] │
│                                                           │
│   ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐                   │
│   │ 💻  │  │ 💻  │  │ 💻  │  │ 💻  │    ← desks        │
│   │Laura│  │Flora│  │Coder│  │ CS  │                   │
│   └─────┘  └─────┘  └─────┘  └─────┘                   │
│                                                           │
│   Hover em qualquer agente → tooltip com status + task   │
└─────────────────────────────────────────────────────────┘
```

## Implementação (opção mais simples se pixel art for complexo)
Se pixel art isométrico for muito complexo, usar:
- Grid de cards estilo "desk" (mesa + avatar + monitor)
- CSS animations para mostrar "digitando" quando active
- Monitor com glow verde quando active, cinza quando idle
- Card flip/hover para ver detalhes do agente

Exemplo de desk card:
```tsx
<DeskCard agent={agent}>
  <Monitor active={agent.status === 'active'} />
  <Avatar emoji={agent.emoji} status={agent.status} />
  <NameTag name={agent.name} role={agent.role} />
  {agent.currentTask && <TaskBadge task={agent.currentTask} />}
</DeskCard>
```

## Arquivos a criar
1. `src/client/routes/office.tsx` — componente principal
2. `src/client/components/dashboard/office/DeskCard.tsx`
3. `src/client/components/dashboard/office/Monitor.tsx`
4. `src/client/components/dashboard/office/AgentAvatar.tsx`
5. `src/server/routers/office.ts` — router tRPC
6. Adicionar `officeRouter` ao `src/server/trpc.ts`

## Sidebar navigation
Adicionar item "Office" no menu lateral com ícone `Building2` (lucide-react).

## Quality gates
- `bun run type-check` sem erros
- `bun run lint:check` sem warnings
- Nenhum `any` explícito
