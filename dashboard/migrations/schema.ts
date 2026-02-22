import { pgTable, uuid, text, jsonb, timestamp, numeric, index, vector, real, unique, foreignKey, integer, bigint, boolean, serial, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const evolutionStatus = pgEnum("evolution_status", ['running', 'success', 'failed', 'skipped'])
export const evolutionTrigger = pgEnum("evolution_trigger", ['cron', 'heartbeat', 'manual', 'mad_dog'])
export const memoryCategory = pgEnum("memory_category", ['lesson', 'pattern', 'correction', 'decision', 'preference', 'gotcha'])
export const sourceType = pgEnum("source_type", ['drive', 'notion', 'kiwify', 'asaas'])


export const auditLog = pgTable("audit_log", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tool: text().notNull(),
	params: jsonb(),
	result: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const savedConfigs = pgTable("saved_configs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	label: text().notNull(),
	config: jsonb().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const students = pgTable("students", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	email: text(),
	phone: text(),
	cpf: text(),
	course: text(),
	turma: text(),
	paymentStatus: text("payment_status"),
	totalPaid: numeric("total_paid", { precision: 10, scale:  2 }),
	totalPending: numeric("total_pending", { precision: 10, scale:  2 }),
	rawData: jsonb("raw_data"),
	lastSync: timestamp("last_sync", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const agentMemories = pgTable("agent_memories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	content: text().notNull(),
	embedding: vector({ dimensions: 768 }),
	category: memoryCategory().notNull(),
	source: text().notNull(),
	metadata: jsonb(),
	score: real().default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("memories_category_idx").using("btree", table.category.asc().nullsLast().op("enum_ops")),
	index("memories_embedding_idx").using("hnsw", table.embedding.asc().nullsLast().op("vector_cosine_ops")),
	index("memories_score_idx").using("btree", table.score.asc().nullsLast().op("float4_ops")),
]);

export const capabilityScores = pgTable("capability_scores", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	capability: text().notNull(),
	frequency: real().default(0),
	failureReduction: real("failure_reduction").default(0),
	userBurden: real("user_burden").default(0),
	selfCost: real("self_cost").default(0),
	totalScore: real("total_score").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("capability_name_idx").using("btree", table.capability.asc().nullsLast().op("text_ops")),
	index("capability_score_idx").using("btree", table.totalScore.asc().nullsLast().op("float4_ops")),
]);

export const driveAccounts = pgTable("drive_accounts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userEmail: text("user_email").notNull(),
	accessToken: text("access_token").notNull(),
	refreshToken: text("refresh_token").notNull(),
	tokenExpiry: timestamp("token_expiry", { withTimezone: true, mode: 'string' }).notNull(),
	scopes: text().array().default([""]),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("drive_accounts_user_email_unique").on(table.userEmail),
]);

export const chunks = pgTable("chunks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	fileId: uuid("file_id").notNull(),
	chunkIndex: integer("chunk_index").notNull(),
	content: text().notNull(),
	startOffset: integer("start_offset"),
	endOffset: integer("end_offset"),
	heading: text(),
	contentHash: text("content_hash").notNull(),
	embedding: vector({ dimensions: 768 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("chunks_embedding_idx").using("hnsw", table.embedding.asc().nullsLast().op("vector_cosine_ops")),
	index("chunks_file_id_idx").using("btree", table.fileId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.fileId],
			foreignColumns: [files.id],
			name: "chunks_file_id_files_id_fk"
		}).onDelete("cascade"),
]);

export const driveChannels = pgTable("drive_channels", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	accountId: uuid("account_id").notNull(),
	channelId: text("channel_id").notNull(),
	resourceId: text("resource_id").notNull(),
	token: text().notNull(),
	expiration: timestamp({ withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [driveAccounts.id],
			name: "drive_channels_account_id_drive_accounts_id_fk"
		}).onDelete("cascade"),
	unique("drive_channels_channel_id_unique").on(table.channelId),
]);

export const evolutionCycles = pgTable("evolution_cycles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	status: evolutionStatus().default('running').notNull(),
	trigger: evolutionTrigger().notNull(),
	findings: jsonb(),
	actions: jsonb(),
	memoriesCreated: integer("memories_created").default(0),
	durationMs: integer("duration_ms"),
	error: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("cycles_created_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("cycles_status_idx").using("btree", table.status.asc().nullsLast().op("enum_ops")),
]);

export const files = pgTable("files", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	accountId: uuid("account_id"),
	sourceType: sourceType("source_type").default('drive').notNull(),
	sourceId: text("source_id"),
	fileId: text("file_id").notNull(),
	name: text().notNull(),
	path: text().notNull(),
	mimeType: text("mime_type").notNull(),
	modifiedTime: timestamp("modified_time", { withTimezone: true, mode: 'string' }).notNull(),
	contentHash: text("content_hash"),
	owners: text().array().default([""]),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	sizeBytes: bigint("size_bytes", { mode: "number" }),
	isOversized: boolean("is_oversized").default(false).notNull(),
	trashed: boolean().default(false).notNull(),
	extractionError: text("extraction_error"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [driveAccounts.id],
			name: "files_account_id_drive_accounts_id_fk"
		}).onDelete("cascade"),
]);

export const driveState = pgTable("drive_state", {
	accountId: uuid("account_id").primaryKey().notNull(),
	startPageToken: text("start_page_token").notNull(),
	lastPageToken: text("last_page_token").notNull(),
	lastSyncAt: timestamp("last_sync_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.accountId],
			foreignColumns: [driveAccounts.id],
			name: "drive_state_account_id_drive_accounts_id_fk"
		}).onDelete("cascade"),
]);

export const tasks = pgTable("tasks", {
	id: serial().primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
	phase: integer().default(1),
	priority: text().default('medium'),
	status: text().default('pending'),
	agent: text().default('laura'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const subtasks = pgTable("subtasks", {
	id: serial().primaryKey().notNull(),
	taskId: integer("task_id"),
	title: text().notNull(),
	status: text().default('pending'),
	phase: integer().default(1),
	agent: text().default('laura'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasks.id],
			name: "subtasks_task_id_fkey"
		}),
]);

export const taskEvents = pgTable("task_events", {
	id: serial().primaryKey().notNull(),
	taskId: integer("task_id"),
	agent: text().default('laura'),
	eventType: text("event_type").notNull(),
	payload: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.taskId],
			foreignColumns: [tasks.id],
			name: "task_events_task_id_fkey"
		}),
]);

export const lauraMemories = pgTable("laura_memories", {
	id: serial().primaryKey().notNull(),
	content: text().notNull(),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

export const products = pgTable("products", {
	id: serial().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	price: numeric(),
	format: text(),
	category: text(),
	details: jsonb(),
	embedding: vector({ dimensions: 768 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});
