import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";

export const courseTypeEnum = pgEnum("course_type", ["AEO", "ALO"]);

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  supabaseId: uuid("supabase_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  course: courseTypeEnum("course").notNull(),
  serviceId: text("service_id").notNull().unique(),
});
