ALTER TABLE "lessons" RENAME COLUMN "file_url" TO "file_id";--> statement-breakpoint
ALTER TABLE "files" DROP CONSTRAINT "files_lesson_id_lessons_id_fk";
--> statement-breakpoint
ALTER TABLE "document_chunks" ADD COLUMN "page_number" integer;--> statement-breakpoint
ALTER TABLE "document_chunks" ADD COLUMN "start_position" integer;--> statement-breakpoint
ALTER TABLE "document_chunks" ADD COLUMN "end_position" integer;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" DROP COLUMN "lesson_id";