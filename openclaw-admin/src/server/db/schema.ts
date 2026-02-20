import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core'

export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  tool: text('tool').notNull(),
  params: jsonb('params'),
  result: jsonb('result'),
  createdAt: timestamp('created_at').defaultNow()
})

export const savedConfigs = pgTable('saved_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  label: text('label').notNull(),
  config: jsonb('config').notNull(),
  createdAt: timestamp('created_at').defaultNow()
})
