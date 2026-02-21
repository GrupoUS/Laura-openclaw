import {
  pgTable, pgEnum, uuid, text, integer, timestamp,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ── Enums ──────────────────────────────────────────────

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

// ── Tables ─────────────────────────────────────────────

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

// ── Relations (required for relational queries) ────────

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
