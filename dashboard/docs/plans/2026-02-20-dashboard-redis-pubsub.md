```yaml
OBJECTIVE: "Substituir o EventEmitter singleton por Upstash Redis Pub/Sub em dashboard/lib/events/emitter.ts para suportar múltiplas instâncias Railway com zero alterações nas rotas e SSE endpoint"
SCOPE: "IN: emitter.ts (swap de implementação) + deps + env vars + railway.toml / OUT: rotas HTTP, SSE endpoint, Kanban UI, store Zustand — nenhum desses arquivos muda"
TOOL: "gateway → agent: coder"
PARAMS:
  model: "anthropic/claude-opus-4-6"
  workspace: "~/projects/Laura-openclaw/dashboard"
  milestone_dependencies: ["Milestone B (SSE EventBus)", "Milestone C (Kanban UI)"]
  gatewayToken: "{GATEWAY_TOKEN: string}"
  env_required:
    - UPSTASH_REDIS_REST_URL
    - UPSTASH_REDIS_REST_TOKEN
    - UPSTASH_REDIS_URL
    - REDIS_EVENTS_CHANNEL    # opcional — default: laura:task-events
```

***

## Plan — Upstash Redis Pub/Sub Migration

> **Para o Coder:** Execute com `/implement` após aprovação.
> **Save:** `docs/plans/2026-02-20-dashboard-redis-pubsub.md`

**Goal:** Trocar o `EventEmitter` singleton (que falha em múltiplas instâncias Railway) por Upstash Redis Pub/Sub, mantendo a interface pública de `emitter.ts` **100% idêntica** — de modo que as 4 rotas de escrita, o SSE endpoint e todos os componentes da Milestone C não precisem de nenhuma alteração.

**Architecture:** Dois clientes Redis com responsabilidades separadas: `@upstash/redis` (REST, edge-safe) para **publicar** eventos das rotas HTTP; `ioredis` (TCP persistente, Node.js-only) para **subscrever** ao canal e distribuir em memória para os handlers SSE registrados. A separação é obrigatória — uma conexão Redis em modo `SUBSCRIBE` só aceita comandos de subscribe/unsubscribe. O padrão `globalThis` garante singleton por instância Railway. [upstash](https://upstash.com/blog/realtime-notifications)

**Tech Stack:** `@upstash/redis` · `ioredis` v5 · TypeScript · Upstash Redis (managed)

**Complexity:** L5 — troca cirúrgica de uma única implementação, sem impacto em outros arquivos. Risco elevado apenas no gerenciamento de conexão TCP.

***

## Research Summary

| # | Finding | Confidence | Source | Impact |
|---|---------|------------|--------|--------|
| 1 | Pub/Sub Redis exige dois clientes: um para PUBLISH, outro exclusivo para SUBSCRIBE | 5 | redis.io/docs  [redis](https://redis.io/docs/latest/develop/pubsub/) | CRITICAL |
| 2 | Upstash recomenda `@upstash/redis` para PUBLISH (REST) e `ioredis` para SUBSCRIBE (TCP) | 5 | upstash.com/blog  [upstash](https://upstash.com/blog/realtime-notifications) | HIGH |
| 3 | `ioredis` v5 inclui tipos TypeScript nativos — não precisa de `@types/ioredis` | 5 | ioredis npm | MEDIUM |
| 4 | Railway requer TLS para Redis externo — URL deve usar `rediss://` (duplo S)  [upstash](https://upstash.com/blog/realtime-notifications) | 5 | upstash.com/blog  [upstash](https://upstash.com/blog/realtime-notifications) | HIGH |
| 5 | `globalThis` singleton previne múltiplas conexões ioredis em hot-reload Next.js | 5 | stackoverflow  [stackoverflow](https://stackoverflow.com/questions/71489656/using-a-redis-singleton-for-nextjs-api-routes) | HIGH |
| 6 | `publish()` pode permanecer `void` (fire-and-forget com `.catch`) — rotas não precisam ser alteradas | 4 | análise da Milestone B | HIGH |
| 7 | Railway configuração ioredis requer `enableAutoPipelining: false` para sub mode | 4 | railway.com/docs  [docs.railway](https://docs.railway.com/networking/private-networking/library-configuration) | MEDIUM |

**Edge Cases:**
1. Upstash REST API fora do ar → eventos perdidos silenciosamente (publish fire-and-forget)
2. ioredis desconecta → `reconnectOnError` garante re-subscribe automático
3. Hot-reload em dev → `globalThis` evita segunda conexão, mas log duplicado possível
4. Channel com nome errado → eventos publicados mas nunca recebidos
5. `SIGTERM` no Railway → ioredis deve dar `quit()` para liberar conexão limpa

***

## Risk Assessment

| # | Risk | Score | Mitigation |
|---|------|-------|------------|
| 1 | `SUBSCRIBE` e `PUBLISH` na mesma conexão ioredis → erro fatal Redis | **9** | **BLOCK** — dois singletons separados: `_lauraSub` e `_lauraPub`. Pub usa `@upstash/redis` REST, não ioredis |
| 2 | ioredis sem TLS com Upstash → conexão recusada | **8** | URL obrigatoriamente `rediss://` + `tls: {}` option |
| 3 | `numReplicas` removido antes de Redis funcionar → múltiplas instâncias sem sync | **7** | **Ordem obrigatória:** Redis funcionando em staging → remover `numReplicas = 1` → só então escalar |
| 4 | Evento perdido se Upstash REST falhar antes do PUBLISH completar | 4 | **ACCEPT** — UI tolera latência; sem dado crítico perdido (NeonDB já persistiu) |
| 5 | ioredis acumula listeners sem cleanup → `MaxListenersExceededWarning` | 3 | `setMaxListeners(0)` no subscriber singleton |

***

## ADR: Upstash Managed vs Redis no próprio Railway

**Context:** Precisamos de Redis para pub/sub multi-instância. Duas opções viáveis.

**Options:**
- A) **Upstash Redis Managed** — SaaS, free tier 10k cmd/dia, zero config de infraestrutura [railway](https://railway.com/deploy/upstash-redis-adaptor)
- B) **Redis no Railway** — `railway.com/deploy/redis`, auto-provisionado, billing Railway [railway](https://railway.com/deploy/redis)

**Decision:** Upstash (A) — free tier suficiente para volume atual (< 100 eventos/dia), conexão via TLS externa, zero gerenciamento de servidor. Migrar para Railway Redis (B) apenas se custo Upstash superar Railway.

**Consequences:** Latência adicional de ~5-15ms por publish via REST. Para updates de Kanban, imperceptível ao usuário.

***

## Princípio Central desta Migração

```
╔══════════════════════════════════════════════════════════╗
║  APENAS emitter.ts muda.                                 ║
║                                                          ║
║  Milestone B (rotas + SSE) → ZERO alterações            ║
║  Milestone C (UI + hooks)  → ZERO alterações            ║
║  Tests existentes          → PASSAM sem modificação     ║
╚══════════════════════════════════════════════════════════╝
```

Interface pública que NÃO muda:
```typescript
eventBus.publish(event: TaskEvent): void       // fire-and-forget
eventBus.subscribe(handler): () => void        // retorna unsubscribe
eventBus.getListenerCount(): number
```

***

## Estrutura de Arquivos — Apenas o Mínimo

```
dashboard/
└── lib/
    └── events/
        ├── emitter.ts          ← SUBSTITUIR implementação (interface idêntica)
        └── types.ts            ← EXTRAIR tipos (sem mudança de conteúdo)

Nenhum outro arquivo é tocado.
```

***

## Tasks

### Phase 1: Criar Conta Upstash + Credenciais [SEQUENTIAL]

***

#### Task 1.1 — Criar banco Redis no Upstash (manual)

**Step 1: Criar conta e banco**
```
1. Acesse https://console.upstash.com
2. Clique "Create Database"
3. Name: laura-events
4. Type: Regional
5. Region: US-East-1 (mais próxima do Railway US)
6. TLS: ✅ Enable (obrigatório)
7. Clique "Create"
```

**Step 2: Copiar credenciais**
```
Na aba "Details" do banco criado, copiar:

UPSTASH_REDIS_REST_URL   = https://XXXXX.upstash.io
UPSTASH_REDIS_REST_TOKEN = AXXXXXXXxxxxxxxxxx==
UPSTASH_REDIS_URL        = rediss://:PASSWORD@XXXXX.upstash.io:6380
```
> ⚠️ A URL do ioredis usa `rediss://` (duplo S = TLS) na porta `6380`, não `redis://` na `6379`.

Validation: No console Upstash → CLI tab → `PING` → `PONG`
Rollback: Deletar banco no console Upstash

***

#### Task 1.2 — Instalar dependências

**Files:**
- Modify: `dashboard/package.json`

**Step 1: Instalar pacotes**
```bash
cd ~/projects/Laura-openclaw/dashboard
npm install ioredis @upstash/redis
```
Validation:
```bash
node -e "require('ioredis'); require('@upstash/redis'); console.log('OK')"
```
Rollback: `npm uninstall ioredis @upstash/redis`

**Step 2: Verificar tipos ioredis (v5 inclui built-in)**
```bash
npx tsc --noEmit -e "import Redis from 'ioredis'; const r: Redis = new Redis()" 2>&1
# Deve ser silencioso (sem erros de tipo)
```

***

#### Task 1.3 — Adicionar variáveis de ambiente

**Files:**
- Modify: `dashboard/.env.local`

```bash
# dashboard/.env.local — adicionar ao final
UPSTASH_REDIS_REST_URL=https://XXXXX.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXXXXXxxxxxxxxxx==
UPSTASH_REDIS_URL=rediss://:PASSWORD@XXXXX.upstash.io:6380
REDIS_EVENTS_CHANNEL=laura:task-events
```
Validation:
```bash
node -e "
  require('dotenv').config({ path: '.env.local' });
  ['UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN','UPSTASH_REDIS_URL']
    .forEach(k => {
      if (!process.env[k]) throw new Error('Missing: ' + k);
      console.log(k + ' ✓');
    });
"
```
Rollback: Remover as 4 linhas do `.env.local`

**Step 2: Commit (sem secrets — apenas template)**
```bash
cat >> dashboard/.env.local.template << 'EOF'
UPSTASH_REDIS_REST_URL=https://XXXXX.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXXXXXxxxxxxxxxx==
UPSTASH_REDIS_URL=rediss://:PASSWORD@XXXXX.upstash.io:6380
REDIS_EVENTS_CHANNEL=laura:task-events
EOF

git add dashboard/.env.local.template
git commit -m "chore(env): add Upstash Redis env vars template for Milestone D"
```

***

### Phase 2: Substituir `emitter.ts` [SEQUENTIAL]

***

#### Task 2.1 — Extrair tipos para `types.ts`

**Files:**
- Create: `dashboard/lib/events/types.ts`
- Modify: `dashboard/lib/events/emitter.ts` (apenas importar de types.ts)

> Este passo isola os tipos para que `emitter.ts` possa ser trocado sem quebrar imports externos.

```typescript
// dashboard/lib/events/types.ts
export type TaskEventType =
  | 'task:created'
  | 'task:updated'
  | 'subtask:created'
  | 'subtask:updated'

export interface TaskEvent {
  type:    TaskEventType
  taskId:  string
  payload: Record<string, unknown>
  agent?:  string
  ts:      string  // ISO 8601
}
```
Validation: `npx tsc --noEmit lib/events/types.ts` → sem erros
Rollback: `rm dashboard/lib/events/types.ts`

***

#### Task 2.2 — Criar novo `emitter.ts` com Redis

**Files:**
- Overwrite: `dashboard/lib/events/emitter.ts`

**Step 1: Verificar test existente da Milestone B antes de trocar**
```bash
cd ~/projects/Laura-openclaw/dashboard
npx vitest run tests/api/events.test.ts
# DEVE passar ANTES da troca — confirma que baseline está ok
```

**Step 2: Substituir `lib/events/emitter.ts`**
```typescript
// dashboard/lib/events/emitter.ts
/**
 * TaskEventBus — Milestone D
 * Implementação: Upstash Redis Pub/Sub
 * Interface: IDÊNTICA à Milestone B (EventEmitter)
 *
 * PUBLISH → @upstash/redis REST API (edge-safe, fire-and-forget)
 * SUBSCRIBE → ioredis TCP singleton (Node.js-only, recebe de TODAS as instâncias Railway)
 */
import { Redis as UpstashRedis } from '@upstash/redis'
import IoRedis from 'ioredis'
import type { TaskEvent } from './types'

export type { TaskEvent, TaskEventType } from './types'

// ─── Configuração ────────────────────────────────────────────────
const CHANNEL = process.env.REDIS_EVENTS_CHANNEL ?? 'laura:task-events'

function requireEnv(key: string): string {
  const val = process.env[key]
  if (!val) throw new Error(`[EventBus] Variável de ambiente ausente: ${key}`)
  return val
}

// ─── Publisher — @upstash/redis REST ─────────────────────────────
// REST API: edge-safe, stateless, sem conexão persistente
function getPublisher(): UpstashRedis {
  return new UpstashRedis({
    url:   requireEnv('UPSTASH_REDIS_REST_URL'),
    token: requireEnv('UPSTASH_REDIS_REST_TOKEN'),
  })
}

// ─── Subscriber — ioredis TCP ─────────────────────────────────────
// TCP persistente: recebe mensagens de TODAS as instâncias Railway
// CRÍTICO: conexão em modo SUBSCRIBE não pode fazer PUBLISH
type Handler = (event: TaskEvent) => void

class TaskEventBus {
  private subscriber: IoRedis
  private handlers   = new Set<Handler>()

  constructor() {
    this.subscriber = new IoRedis(requireEnv('UPSTASH_REDIS_URL'), {
      // TLS obrigatório para Upstash (rediss:// já inclui, mas garantir)
      tls: {},
      // Retry com backoff exponencial (Railway pode reiniciar o processo)
      retryStrategy: (times: number) => Math.min(times * 200, 5000),
      // Necessário para modo SUBSCRIBE no Railway [web:93]
      enableAutoPipelining: false,
      // Previne MaxListenersExceeded warning
      maxRetriesPerRequest: null,
      lazyConnect: false,
    })

    // Desativar limite de listeners (SSE: 1 handler por browser conectado)
    this.subscriber.setMaxListeners(0)

    // Subscrever ao canal uma única vez
    this.subscriber.subscribe(CHANNEL, (err) => {
      if (err) {
        console.error(`[EventBus] Falha ao subscrever ${CHANNEL}:`, err.message)
      } else {
        console.log(`[EventBus] Subscrito ao canal Redis: ${CHANNEL}`)
      }
    })

    // Distribuir mensagens Redis → handlers SSE em memória
    this.subscriber.on('message', (channel: string, raw: string) => {
      if (channel !== CHANNEL) return
      try {
        const event: TaskEvent = JSON.parse(raw)
        this.handlers.forEach((h) => {
          try { h(event) } catch { /* handler individual não deve derrubar os outros */ }
        })
      } catch {
        console.warn('[EventBus] Mensagem Redis inválida (não é JSON):', raw)
      }
    })

    // Logs de estado da conexão para Railway logs
    this.subscriber.on('connect',      () => console.log('[EventBus] ioredis conectado'))
    this.subscriber.on('reconnecting', () => console.log('[EventBus] ioredis reconectando...'))
    this.subscriber.on('error',  (e)  => console.error('[EventBus] ioredis erro:', e.message))

    // Graceful shutdown — libera conexão TCP quando Railway envia SIGTERM
    process.once('SIGTERM', () => {
      console.log('[EventBus] SIGTERM recebido — encerrando subscriber')
      this.subscriber.quit().catch(() => { /* ignorar erro no shutdown */ })
    })
  }

  // ─── Interface pública (IDÊNTICA à Milestone B) ──────────────
  // Fire-and-forget: rota HTTP não aguarda confirmação do Redis
  // NeonDB já persistiu o dado — evento SSE é best-effort
  publish(event: TaskEvent): void {
    getPublisher()
      .publish(CHANNEL, JSON.stringify(event))
      .then(() => {
        console.log(`[EventBus] ✓ ${event.type} | task:${event.taskId} | agent:${event.agent ?? 'system'}`)
      })
      .catch((err) => {
        console.error(`[EventBus] ✗ Falha ao publicar ${event.type}:`, err.message)
        // Não lançar — a rota HTTP já retornou 200, dado está no NeonDB
      })
  }

  subscribe(handler: Handler): () => void {
    this.handlers.add(handler)
    return () => this.handlers.delete(handler)
  }

  getListenerCount(): number {
    return this.handlers.size
  }
}

// ─── Singleton por instância Railway via globalThis ───────────────
// Previne múltiplas conexões ioredis durante hot-reload em dev
const g = globalThis as unknown as { _lauraEventBus?: TaskEventBus }

export const eventBus: TaskEventBus =
  g._lauraEventBus ?? (g._lauraEventBus = new TaskEventBus())
```

Validation:
```bash
# Verificar tipos TypeScript
cd ~/projects/Laura-openclaw/dashboard
npx tsc --noEmit lib/events/emitter.ts
# → sem erros

# Verificar que interface continua idêntica
npx tsc --noEmit --strict lib/events/emitter.ts 2>&1 | head -5
```
Rollback:
```bash
git checkout dashboard/lib/events/emitter.ts
```

***

#### Task 2.3 — Rodar todos os testes da Milestone B sem modificação

```bash
cd ~/projects/Laura-openclaw/dashboard
npx vitest run tests/api/events.test.ts
```

> Os 3 testes da Milestone B devem passar **sem qualquer alteração** — isso confirma que a interface foi preservada.

Validation esperada:
```
✓ emite e recebe evento task:created
✓ cleanup remove listener corretamente
✓ filtros por agent no subscribe
TEST FILES 1 passed (1)
TESTS      3 passed (3)
```

Se algum teste falhar → **STOP** — a interface foi quebrada. Reverter Task 2.2 e investigar.

***

#### Task 2.4 — Teste de conectividade Redis ao vivo

**Files:**
- Create: `dashboard/tests/lib/redis-pubsub.test.ts` (test temporário — deletar após validação)

```typescript
// dashboard/tests/lib/redis-pubsub.test.ts
import { describe, it, expect } from 'vitest'
import { eventBus } from '../../lib/events/emitter'

// ATENÇÃO: este teste requer UPSTASH_REDIS_* em .env.local
// Executa comunicação real com Upstash Redis

describe('Redis Pub/Sub — conectividade ao vivo', () => {
  it('publish → subscribe round-trip em < 500ms', async () => {
    const received: any[] = []
    const unsub = eventBus.subscribe((e) => received.push(e))

    // Aguardar subscriber estar pronto
    await new Promise(r => setTimeout(r, 300))

    eventBus.publish({
      type:    'task:created',
      taskId:  'redis-test-' + Date.now(),
      payload: { title: 'Redis Test' },
      agent:   'coder',
      ts:      new Date().toISOString(),
    })

    // Aguardar o round-trip Redis (REST publish → TCP receive)
    await new Promise(r => setTimeout(r, 400))

    unsub()

    expect(received.length).toBeGreaterThanOrEqual(1)
    expect(received[0].type).toBe('task:created')
    expect(received[0].agent).toBe('coder')
  }, 5000)  // timeout 5s para latência Upstash
})
```

Validation:
```bash
UPSTASH_REDIS_REST_URL=$UPSTASH_REDIS_REST_URL \
UPSTASH_REDIS_REST_TOKEN=$UPSTASH_REDIS_REST_TOKEN \
UPSTASH_REDIS_URL=$UPSTASH_REDIS_URL \
npx vitest run tests/lib/redis-pubsub.test.ts

# → ✓ publish → subscribe round-trip em < 500ms
# → [EventBus] Subscrito ao canal Redis: laura:task-events
# → [EventBus] ✓ task:created | task:redis-test-XXXX | agent:coder
```
Rollback: `rm dashboard/tests/lib/redis-pubsub.test.ts`

**Step 2: Deletar teste temporário após passar**
```bash
rm dashboard/tests/lib/redis-pubsub.test.ts
git add -A
git commit -m "chore(test): remove temporary redis connectivity test"
```

***

### Phase 3: Atualizar `railway.toml` [SEQUENTIAL]

***

#### Task 3.1 — Remover `numReplicas = 1` do `railway.toml`

**Files:**
- Modify: `dashboard/railway.toml`

**Step 1: Verificar estado atual**
```bash
cat ~/projects/Laura-openclaw/dashboard/railway.toml | grep numReplicas
# → numReplicas = 1  (da Milestone B)
```

**Step 2: Remover restrição e adicionar scaling**
```toml
# dashboard/railway.toml — versão Milestone D
[build]
builder       = "nixpacks"
buildCommand  = "npm install && npm run build"

[deploy]
startCommand          = "npm run start"
healthcheckPath       = "/api/health"
healthcheckTimeout    = 30
restartPolicyType     = "on_failure"
restartPolicyMaxRetries = 3
# numReplicas = 1 REMOVIDO — Redis Pub/Sub suporta múltiplas instâncias

[deploy.watchPaths]
included = ["/dashboard/**"]
excluded = ["/openclaw-admin/**", "*.md", "docs/**"]
```

> `numReplicas` removido = Railway pode escalar para N instâncias. Cada instância tem seu próprio ioredis subscriber. Todos os subscribers recebem todos os eventos do Redis. Cada um encaminha para seus browsers SSE conectados. Multi-instance funciona ✅ [redis](https://redis.io/docs/latest/develop/pubsub/)

Validation: `cat dashboard/railway.toml | grep numReplicas` → sem output (linha removida)
Rollback: Adicionar `numReplicas = 1` de volta (reverte para single-instance segura)

***

#### Task 3.2 — Adicionar variáveis no Railway Dashboard

**No Railway → Serviço `dashboard` → Variables:**

```
UPSTASH_REDIS_REST_URL    = https://XXXXX.upstash.io
UPSTASH_REDIS_REST_TOKEN  = AXXXXXXXxxxxxxxxxx==
UPSTASH_REDIS_URL         = rediss://:PASSWORD@XXXXX.upstash.io:6380
REDIS_EVENTS_CHANNEL      = laura:task-events
```

Validation:
```bash
# Após redeploy no Railway:
curl -s https://tasks.laura.gpus.me/api/health | jq '.sse'
# → {"activeClients": 0, "status": "ready"}
# → Railway logs mostram: [EventBus] Subscrito ao canal Redis: laura:task-events
```

***

### Phase 4: Validação Multi-instância + Commit Final [SEQUENTIAL]

***

#### Task 4.1 — Simular multi-instância localmente

```bash
# Terminal A — instância 1 (porta 3000)
cd ~/projects/Laura-openclaw/dashboard
PORT=3000 npm run dev

# Terminal B — instância 2 (porta 3001)
PORT=3001 npm run dev

# Terminal C — escutar SSE na instância 1
curl -N "http://localhost:3000/api/events?token=$NEXT_PUBLIC_SSE_READ_TOKEN"

# Terminal D — escutar SSE na instância 2
curl -N "http://localhost:3001/api/events?token=$NEXT_PUBLIC_SSE_READ_TOKEN"

# Terminal E — publicar evento via instância 1
curl -s -X POST -H "x-laura-secret: $LAURA_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"title":"Multi-instance test","agent":"coder","priority":"critical"}' \
  http://localhost:3000/api/tasks
```

**Resultado esperado:**
```
# Terminal C (instância 1) recebe:
event: task:created
data: {"type":"task:created","taskId":"<uuid>","agent":"coder",...}

# Terminal D (instância 2) TAMBÉM recebe o mesmo evento ← prova do Redis fan-out
event: task:created
data: {"type":"task:created","taskId":"<uuid>","agent":"coder",...}
```
Validation: **Ambas as instâncias recebem o evento** — EventEmitter da Milestone B só teria entregue para a instância 1
Rollback: `git checkout dashboard/railway.toml && git checkout dashboard/lib/events/emitter.ts`

***

#### Task 4.2 — Commit final + deploy Railway

**Step 1: Rodar toda a suíte de testes**
```bash
cd ~/projects/Laura-openclaw/dashboard
npx vitest run
# Todos os testes da Milestone B devem passar:
# ✓ tests/api/events.test.ts (3 tests)
# ✓ tests/api/tasks.integration.test.ts (6 tests)
# ✓ tests/lib/queries.test.ts (1 test)
```

**Step 2: Commit final**
```bash
cd ~/projects/Laura-openclaw
git add dashboard/
git commit -m "feat(events): migrate EventEmitter → Upstash Redis Pub/Sub (Milestone D)

BREAKING: emitter.ts agora requer UPSTASH_REDIS_* env vars
INTERFACE: publish/subscribe/getListenerCount — 100% idêntica à Milestone B
RESULTADO: múltiplas instâncias Railway sincronizadas via Redis fan-out

- lib/events/emitter.ts: @upstash/redis (publisher REST) + ioredis (subscriber TCP)
- lib/events/types.ts: tipos extraídos para reuso
- railway.toml: numReplicas=1 removido — suporte a auto-scaling
- .env.local.template: UPSTASH_REDIS_* vars adicionados

Milestones A, B, C: zero alterações (interface preservada)"

git push origin main
```

**Step 3: Monitorar Railway deploy**
```bash
# Após deploy ficar verde:
curl -s https://tasks.laura.gpus.me/api/health | jq '.'
```
Resultado esperado:
```json
{
  "status": "ok",
  "service": "laura-dashboard",
  "db": "connected",
  "sse": {
    "activeClients": 0,
    "status": "ready"
  },
  "ts": "2026-02-20T..."
}
```
E nos Railway logs:
```
[EventBus] ioredis conectado
[EventBus] Subscrito ao canal Redis: laura:task-events
```

***

## Arquitetura Final Multi-Instância

```
╔══════ Railway Instance 1 ═════╗    ╔══════ Railway Instance 2 ═════╗
║                               ║    ║                               ║
║  Agente Coder                 ║    ║  Browser Maurício             ║
║  PATCH /api/tasks/:id         ║    ║  EventSource /api/events      ║
║          │                    ║    ║          ▲                    ║
║  eventBus.publish(event)      ║    ║  ioredis subscriber           ║
║          │                    ║    ║          │                    ║
║  @upstash/redis REST          ║    ╚══════════╪════════════════════╝
║  .publish("laura:task-events")║              │
╚═══════════════════════════════╝              │
                │                              │
                ▼                              │
         ╔═══════════════╗                     │
         ║ Upstash Redis ║─────────────────────┘
         ║  (managed)    ║   fan-out para TODOS
         ╚═══════════════╝   os subscribers
                │
                ▼
╔══════ Railway Instance 1 ═════╗
║  ioredis subscriber           ║
║  → handlers SSE em memória    ║
║  → Browser A ✓                ║
║  → Browser B ✓                ║
╚═══════════════════════════════╝
```

***

## Milestones Concluídos

| # | Milestone | Status | Arquivos tocados |
|---|-----------|--------|-----------------|
| A | REST API (9 endpoints, NeonDB) | ✅ | `app/api/`, `lib/db/` |
| B | SSE Pub/Sub (EventEmitter) | ✅ | `lib/events/emitter.ts`, `app/api/events/` |
| C | UI Kanban + Lista (dnd-kit, shadcn) | ✅ | `components/`, `hooks/`, `app/(dashboard)/` |
| D | Upstash Redis multi-instância | ✅ | **Apenas `lib/events/emitter.ts`** |

***
