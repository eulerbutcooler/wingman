DO $$ BEGIN
 CREATE TYPE "public"."user_type" AS ENUM('student', 'admin');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "type" "user_type" DEFAULT 'student' NOT NULL;
