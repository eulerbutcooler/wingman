CREATE TYPE "public"."user_type" AS ENUM('student', 'admin');--> statement-breakpoint
ALTER TABLE "document_chunks" ADD COLUMN "heading_text" text;--> statement-breakpoint
ALTER TABLE "document_chunks" ADD COLUMN "heading_level" integer;--> statement-breakpoint
ALTER TABLE "document_chunks" ADD COLUMN "chunk_type" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "type" "user_type" DEFAULT 'student' NOT NULL;