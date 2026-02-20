import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  uuid,
  jsonb,
  real,
  integer,
  vector,
  index,
} from 'drizzle-orm/pg-core'

// ── Enums ──
export const memoryCategoryEnum = pgEnum('memory_category', [
  'lesson',
  'pattern',
  'correction',
  'decision',
  'preference',
  'gotcha',
])

export const evolutionStatusEnum = pgEnum('evolution_status', [
  'running',
  'success',
  'failed',
  'skipped',
])

export const evolutionTriggerEnum = pgEnum('evolution_trigger', [
  'cron',
  'heartbeat',
  'manual',
  'mad_dog',
])

// ── Existing Tables ──

export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  tool: text('tool').notNull(),
  params: jsonb('params'),
  result: jsonb('result'),
  createdAt: timestamp('created_at').defaultNow(),
})

export const savedConfigs = pgTable('saved_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  label: text('label').notNull(),
  config: jsonb('config').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
})

// ── Agent Memories (pgvector) ──

export const agentMemories = pgTable(
  'agent_memories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    content: text('content').notNull(),
    embedding: vector('embedding', { dimensions: 768 }),
    category: memoryCategoryEnum('category').notNull(),
    source: text('source').notNull(),
    metadata: jsonb('metadata'),
    score: real('score').default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('memories_embedding_idx').using(
      'hnsw',
      table.embedding.op('vector_cosine_ops')
    ),
    index('memories_category_idx').on(table.category),
    index('memories_score_idx').on(table.score),
  ]
)

// ── Evolution Cycles ──

export const evolutionCycles = pgTable(
  'evolution_cycles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    status: evolutionStatusEnum('status').notNull().default('running'),
    trigger: evolutionTriggerEnum('trigger').notNull(),
    findings: jsonb('findings'),
    actions: jsonb('actions'),
    memoriesCreated: integer('memories_created').default(0),
    durationMs: integer('duration_ms'),
    error: text('error'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    index('cycles_status_idx').on(table.status),
    index('cycles_created_idx').on(table.createdAt),
  ]
)

// ── Capability Scores (VFM Tracking) ──

export const capabilityScores = pgTable(
  'capability_scores',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    capability: text('capability').notNull(),
    frequency: real('frequency').default(0),
    failureReduction: real('failure_reduction').default(0),
    userBurden: real('user_burden').default(0),
    selfCost: real('self_cost').default(0),
    totalScore: real('total_score').default(0),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    index('capability_name_idx').on(table.capability),
    index('capability_score_idx').on(table.totalScore),
  ]
)
