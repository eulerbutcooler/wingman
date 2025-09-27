ALTER TABLE "users" RENAME COLUMN "serial_id" TO "service_id";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_serial_id_unique";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_service_id_unique" UNIQUE("service_id");