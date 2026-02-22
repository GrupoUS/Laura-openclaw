CREATE TYPE "public"."evolution_status" AS ENUM('running', 'success', 'failed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."evolution_trigger" AS ENUM('cron', 'heartbeat', 'manual', 'mad_dog');--> statement-breakpoint
CREATE TYPE "public"."memory_category" AS ENUM('lesson', 'pattern', 'correction', 'decision', 'preference', 'gotcha');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('drive', 'notion', 'kiwify', 'asaas');--> statement-breakpoint
CREATE TABLE "agent_memories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(768),
	"category" "memory_category" NOT NULL,
	"source" text NOT NULL,
	"metadata" jsonb,
	"score" real DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tool" text NOT NULL,
	"params" jsonb,
	"result" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "capability_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"capability" text NOT NULL,
	"frequency" real DEFAULT 0,
	"failure_reduction" real DEFAULT 0,
	"user_burden" real DEFAULT 0,
	"self_cost" real DEFAULT 0,
	"total_score" real DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_id" uuid NOT NULL,
	"chunk_index" integer NOT NULL,
	"content" text NOT NULL,
	"start_offset" integer,
	"end_offset" integer,
	"heading" text,
	"content_hash" text NOT NULL,
	"embedding" vector(768),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drive_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_email" text NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"token_expiry" timestamp with time zone NOT NULL,
	"scopes" text[] DEFAULT '{}',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "drive_accounts_user_email_unique" UNIQUE("user_email")
);
--> statement-breakpoint
CREATE TABLE "drive_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"channel_id" text NOT NULL,
	"resource_id" text NOT NULL,
	"token" text NOT NULL,
	"expiration" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "drive_channels_channel_id_unique" UNIQUE("channel_id")
);
--> statement-breakpoint
CREATE TABLE "drive_state" (
	"account_id" uuid PRIMARY KEY NOT NULL,
	"start_page_token" text NOT NULL,
	"last_page_token" text NOT NULL,
	"last_sync_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evolution_cycles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "evolution_status" DEFAULT 'running' NOT NULL,
	"trigger" "evolution_trigger" NOT NULL,
	"findings" jsonb,
	"actions" jsonb,
	"memories_created" integer DEFAULT 0,
	"duration_ms" integer,
	"error" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid,
	"source_type" "source_type" DEFAULT 'drive' NOT NULL,
	"source_id" text,
	"file_id" text NOT NULL,
	"name" text NOT NULL,
	"path" text NOT NULL,
	"mime_type" text NOT NULL,
	"modified_time" timestamp with time zone NOT NULL,
	"content_hash" text,
	"owners" text[] DEFAULT '{}',
	"size_bytes" bigint,
	"is_oversized" boolean DEFAULT false NOT NULL,
	"trashed" boolean DEFAULT false NOT NULL,
	"extraction_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"config" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "chunks" ADD CONSTRAINT "chunks_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drive_channels" ADD CONSTRAINT "drive_channels_account_id_drive_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."drive_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "drive_state" ADD CONSTRAINT "drive_state_account_id_drive_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."drive_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_account_id_drive_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."drive_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "memories_embedding_idx" ON "agent_memories" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "memories_category_idx" ON "agent_memories" USING btree ("category");--> statement-breakpoint
CREATE INDEX "memories_score_idx" ON "agent_memories" USING btree ("score");--> statement-breakpoint
CREATE INDEX "capability_name_idx" ON "capability_scores" USING btree ("capability");--> statement-breakpoint
CREATE INDEX "capability_score_idx" ON "capability_scores" USING btree ("total_score");--> statement-breakpoint
CREATE INDEX "chunks_embedding_idx" ON "chunks" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "chunks_file_id_idx" ON "chunks" USING btree ("file_id");--> statement-breakpoint
CREATE INDEX "cycles_status_idx" ON "evolution_cycles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "cycles_created_idx" ON "evolution_cycles" USING btree ("created_at");