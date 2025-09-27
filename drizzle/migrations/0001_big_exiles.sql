CREATE TYPE "public"."course_type" AS ENUM('AEO', 'ALO');--> statement-breakpoint
ALTER TABLE "account" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "account" CASCADE;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "course_type" "course_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "serial_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_serial_id_unique" UNIQUE("serial_id");