# Task #20 — Dashboard: Calendar — Cron Jobs + Tasks Unificados

## Contexto
A rota `/calendar` já existe no dashboard mas exibe apenas tasks do NeonDB.
Precisa ser aprimorada para mostrar TAMBÉM todos os cron jobs agendados do gateway
OpenClaw, unificados numa visão de calendário semanal.

## Referência Visual
Roman.Knox — "Calendar" screen:
- Seção "Always Running" no topo (tarefas que rodam sempre/continuamente)
- Grade semanal (Dom–Sáb) com blocos coloridos por tipo
- Seção "Next Up" no rodapé (próximas execuções)
- Dark mode com cores vibrantes por categoria

## Stack
- Arquivo existente: `src/client/routes/calendar.tsx`
- Backend: `src/server/routers/calendar.ts` (verificar se existe)
- Crons disponíveis via `trpc.crons.list` (já implementado em `src/client/routes/crons.tsx`)

## Dados a unificar

### 1. Cron Jobs (do gateway OpenClaw)
- Usar `trpc.crons.list` que já existe
- Cada cron tem: `id`, `name`, `schedule` (cron expression), `enabled`, `lastRun`, `nextRun`
- Parse do schedule para exibir nos dias corretos da semana
- Cor: `#3B82F6` (azul) com ícone ⏰

### 2. Tasks NeonDB (com due_date ou scheduled_at)
- Tasks com data de criação ou deadline aparecem no calendário
- Cor por departamento (já existe em `getDeptColor`)
- Ícone 📋

## Layout desejado
```
┌─────────────────────────────────────────────────────────┐
│  Scheduled Tasks                           Week ▸  Month │
├─────────────────────────────────────────────────────────┤
│  🔄 Always Running                                       │
│  ┌─────────────────────────────┐ ← chips de crons       │
│  │ sdr-audit-leads  (30min) 🟢 │                        │
│  └─────────────────────────────┘                        │
├──────┬──────┬──────┬──────┬──────┬──────┬──────────────┤
│ Dom  │ Seg  │ Ter  │ Qua  │ Qui  │ Sex  │ Sáb          │
│      │ 🔵   │ 🔵   │ 🔵   │ 🔵   │ 🔵   │              │
│      │cron1 │cron1 │cron1 │cron1 │cron1 │              │
│      │ 🟢   │ 🟢   │ 🟢   │ 🟢   │ 🟢   │              │
│      │task  │task  │task  │task  │task  │              │
├─────────────────────────────────────────────────────────┤
│  ⏭ Next Up                                              │
│  followup-comercial-diario — Seg 10:00  3h 12min        │
│  sdr-audit-leads — 14:30               28min             │
└─────────────────────────────────────────────────────────┘
```

## Funcionalidades a implementar

### 1. Seção "Always Running"
- Crons com schedule que roda múltiplas vezes ao dia (`*/30 * * * *`, etc.)
- Mostrar como chips com status verde/vermelho e intervalo

### 2. Grade semanal
- Parsear cron expression para determinar quais dias da semana o cron roda
- Blocos clicáveis que abrem modal com detalhes (last run, next run, history)
- View switcher: Semana / Mês

### 3. Seção "Next Up"
- Lista ordenada por próxima execução
- Countdown em tempo real (usando `setInterval`)
- Mostrar: nome, horário, tempo restante

### 4. Integração com Laura
- Quando Laura criar um novo cron job, ele deve aparecer automaticamente no calendário
- Real-time via WebSocket ou polling a cada 30s

## Biblioteca para parsear cron
```bash
bun add cron-parser
```
Usar `CronExpression.parse(schedule)` para calcular próximas execuções.

## Arquivos a modificar/criar
1. `src/client/routes/calendar.tsx` — refatorar com novo layout
2. `src/server/routers/calendar.ts` — adicionar endpoint `calendar.unified` que retorna crons + tasks juntos
3. `src/client/components/dashboard/calendar/AlwaysRunningSection.tsx`
4. `src/client/components/dashboard/calendar/WeekGrid.tsx`
5. `src/client/components/dashboard/calendar/NextUpSection.tsx`
6. `src/client/components/dashboard/calendar/CronDetailModal.tsx`

## Quality gates
- `bun run type-check` sem erros
- `bun run lint:check` sem warnings
- Nenhum `any` explícito
