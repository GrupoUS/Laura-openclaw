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
  boolean,
  bigint,
} from 'drizzle-orm/pg-core'

// ── Enums ──
export const sourceTypeEnum = pgEnum('source_type', [
  'drive',
  'notion',
  'kiwify',
  'asaas',
])
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

// ── Universal Data System (Vector Search) ──

export const driveAccounts = pgTable('drive_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userEmail: text('user_email').notNull().unique(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  tokenExpiry: timestamp('token_expiry', { withTimezone: true }).notNull(),
  scopes: text('scopes').array().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const driveChannels = pgTable('drive_channels', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id')
    .notNull()
    .references(() => driveAccounts.id, { onDelete: 'cascade' }),
  channelId: text('channel_id').notNull().unique(),
  resourceId: text('resource_id').notNull(),
  token: text('token').notNull(),
  expiration: timestamp('expiration', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const driveState = pgTable('drive_state', {
  accountId: uuid('account_id')
    .primaryKey()
    .references(() => driveAccounts.id, { onDelete: 'cascade' }),
  startPageToken: text('start_page_token').notNull(),
  lastPageToken: text('last_page_token').notNull(),
  lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const files = pgTable('files', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').references(() => driveAccounts.id, { onDelete: 'cascade' }),
  sourceType: sourceTypeEnum('source_type').notNull().default('drive'),
  sourceId: text('source_id'),
  fileId: text('file_id').notNull(),
  name: text('name').notNull(),
  path: text('path').notNull(),
  mimeType: text('mime_type').notNull(),
  modifiedTime: timestamp('modified_time', { withTimezone: true }).notNull(),
  contentHash: text('content_hash'),
  owners: text('owners').array().default([]),
  sizeBytes: bigint('size_bytes', { mode: 'number' }),
  isOversized: boolean('is_oversized').notNull().default(false),
  trashed: boolean('trashed').notNull().default(false),
  extractionError: text('extraction_error'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const chunks = pgTable(
  'chunks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fileId: uuid('file_id')
      .notNull()
      .references(() => files.id, { onDelete: 'cascade' }),
    chunkIndex: integer('chunk_index').notNull(),
    content: text('content').notNull(),
    startOffset: integer('start_offset'),
    endOffset: integer('end_offset'),
    heading: text('heading'),
    contentHash: text('content_hash').notNull(),
    embedding: vector('embedding', { dimensions: 768 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('chunks_embedding_idx').using('hnsw', table.embedding.op('vector_cosine_ops')),
    index('chunks_file_id_idx').on(table.fileId),
  ]
)

// ══════════════════════════════════════════════════════════════════════════════
// Dashboard Tables (migrated from dashboard/lib/db/schema.ts)
// ══════════════════════════════════════════════════════════════════════════════

import { relations } from 'drizzle-orm'

// ── Dashboard Enums ──

export const taskStatusEnum = pgEnum('task_status', [
  'backlog', 'in_progress', 'done', 'blocked',
])

export const subtaskStatusEnum = pgEnum('subtask_status', [
  'todo', 'doing', 'done', 'blocked',
])

export const priorityEnum = pgEnum('priority', [
  'low', 'medium', 'high', 'critical',
])

export const departmentEnum = pgEnum('department', [
  'Coordenação', 'Comercial', 'Marketing', 'Jurídico', 'Diretoria', 'Outros'
])

// ── Dashboard Tables ──

export const tasks = pgTable('tasks', {
  id:          uuid('id').primaryKey().defaultRandom(),
  title:       text('title').notNull(),
  description: text('description'),
  status:      taskStatusEnum('status').default('backlog').notNull(),
  phase:       integer('phase').default(1).notNull(),
  priority:    priorityEnum('priority').default('medium').notNull(),
  department:  departmentEnum('department').default('Outros').notNull(),
  agent:       text('agent'),
  dueDate:     timestamp('due_date'),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  updatedAt:   timestamp('updated_at').defaultNow().notNull(),
})

export const subtasks = pgTable('subtasks', {
  id:          uuid('id').primaryKey().defaultRandom(),
  taskId:      uuid('task_id').references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
  title:       text('title').notNull(),
  status:      subtaskStatusEnum('status').default('todo').notNull(),
  phase:       integer('phase').default(1).notNull(),
  agent:       text('agent'),
  dueDate:     timestamp('due_date'),
  completedAt: timestamp('completed_at'),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
})

export const taskEvents = pgTable('task_events', {
  id:        uuid('id').primaryKey().defaultRandom(),
  taskId:    uuid('task_id').references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
  agent:     text('agent'),
  eventType: text('event_type').notNull(),
  payload:   text('payload'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ── Dashboard Relations ──

export const tasksRelations = relations(tasks, ({ many }) => ({
  subtasks:   many(subtasks),
  taskEvents: many(taskEvents),
}))

export const subtasksRelations = relations(subtasks, ({ one }) => ({
  task: one(tasks, {
    fields: [subtasks.taskId],
    references: [tasks.id],
  }),
}))

export const taskEventsRelations = relations(taskEvents, ({ one }) => ({
  task: one(tasks, {
    fields: [taskEvents.taskId],
    references: [tasks.id],
  }),
}))

