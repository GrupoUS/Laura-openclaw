import { relations } from "drizzle-orm/relations";
import { files, chunks, driveAccounts, driveChannels, driveState, tasks, subtasks, taskEvents } from "./schema";

export const chunksRelations = relations(chunks, ({one}) => ({
	file: one(files, {
		fields: [chunks.fileId],
		references: [files.id]
	}),
}));

export const filesRelations = relations(files, ({one, many}) => ({
	chunks: many(chunks),
	driveAccount: one(driveAccounts, {
		fields: [files.accountId],
		references: [driveAccounts.id]
	}),
}));

export const driveChannelsRelations = relations(driveChannels, ({one}) => ({
	driveAccount: one(driveAccounts, {
		fields: [driveChannels.accountId],
		references: [driveAccounts.id]
	}),
}));

export const driveAccountsRelations = relations(driveAccounts, ({many}) => ({
	driveChannels: many(driveChannels),
	files: many(files),
	driveStates: many(driveState),
}));

export const driveStateRelations = relations(driveState, ({one}) => ({
	driveAccount: one(driveAccounts, {
		fields: [driveState.accountId],
		references: [driveAccounts.id]
	}),
}));

export const subtasksRelations = relations(subtasks, ({one}) => ({
	task: one(tasks, {
		fields: [subtasks.taskId],
		references: [tasks.id]
	}),
}));

export const tasksRelations = relations(tasks, ({many}) => ({
	subtasks: many(subtasks),
	taskEvents: many(taskEvents),
}));

export const taskEventsRelations = relations(taskEvents, ({one}) => ({
	task: one(tasks, {
		fields: [taskEvents.taskId],
		references: [tasks.id]
	}),
}));