ALTER TABLE "files" DROP CONSTRAINT "files_topic_id_topics_id_fk";
--> statement-breakpoint
ALTER TABLE "files" DROP COLUMN "topic_id";