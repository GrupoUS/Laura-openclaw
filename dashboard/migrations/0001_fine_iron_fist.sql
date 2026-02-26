CREATE TYPE "public"."content_stage" AS ENUM('ideas', 'roteiro', 'thumbnail', 'gravacao', 'edicao', 'publicado');--> statement-breakpoint
CREATE TYPE "public"."department" AS ENUM('Coordenação', 'Comercial', 'Marketing', 'Jurídico', 'Diretoria', 'Outros');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."subtask_status" AS ENUM('todo', 'doing', 'done', 'blocked', 'pending');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('backlog', 'in_progress', 'done', 'blocked', 'pending', 'doing');--> statement-breakpoint
CREATE TABLE "agent_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"description" text,
	"is_editable" boolean DEFAULT true NOT NULL,
	"source" text DEFAULT 'disk' NOT NULL,
	"updated_by" text DEFAULT 'system' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_files_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "content_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"script" text,
	"stage" "content_stage" DEFAULT 'ideas' NOT NULL,
	"position" integer DEFAULT 0,
	"assigned_to" text,
	"thumbnail_url" text,
	"video_url" text,
	"published_url" text,
	"tags" text[] DEFAULT '{}',
	"created_by" text DEFAULT 'main' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "laura_memories" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "lead_handoffs" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_phone" text NOT NULL,
	"lead_name" text,
	"product" text,
	"closer_phone" text,
	"closer_name" text,
	"group_id" text,
	"status" text DEFAULT 'pending',
	"handoff_at" timestamp with time zone DEFAULT now(),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric,
	"format" text,
	"category" text,
	"details" jsonb,
	"embedding" vector(768),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"cpf" text,
	"course" text,
	"turma" text,
	"payment_status" text,
	"total_paid" numeric(10, 2),
	"total_pending" numeric(10, 2),
	"raw_data" jsonb,
	"last_sync" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subtasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"title" text NOT NULL,
	"status" "subtask_status" DEFAULT 'todo',
	"phase" integer DEFAULT 1,
	"agent" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"task_id" integer NOT NULL,
	"agent" text,
	"event_type" text NOT NULL,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "task_status" DEFAULT 'backlog',
	"phase" integer DEFAULT 1,
	"priority" "priority" DEFAULT 'medium',
	"agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subtasks" ADD CONSTRAINT "subtasks_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_events" ADD CONSTRAINT "task_events_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_files_name_idx" ON "agent_files" USING btree ("name");--> statement-breakpoint
CREATE INDEX "content_cards_stage_idx" ON "content_cards" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "content_cards_position_idx" ON "content_cards" USING btree ("position");--> statement-breakpoint
CREATE INDEX "lead_handoffs_status_idx" ON "lead_handoffs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "lead_handoffs_handoff_at_idx" ON "lead_handoffs" USING btree ("handoff_at");--> statement-breakpoint
CREATE INDEX "subtasks_task_idx" ON "subtasks" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_events_task_idx" ON "task_events" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_events_type_idx" ON "task_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "tasks_status_idx" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tasks_agent_idx" ON "tasks" USING btree ("agent");--> statement-breakpoint
CREATE INDEX "drive_channels_account_idx" ON "drive_channels" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "files_account_idx" ON "files" USING btree ("account_id");