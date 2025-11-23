import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  vector,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  gendesc: text("gendesc").notNull(),
  imageUrl: text("image_url"),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const topics = pgTable("topics", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  courseId: uuid("course_id")
    .references(() => courses.id, { onDelete: "cascade" })
    .notNull(),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const lessons = pgTable("lessons", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  type: text("type", { enum: ["pdf", "pptx", "docx"] }).notNull(),
  fileId: uuid("file_id").references(() => files.id, { onDelete: "cascade" }),
  topicId: uuid("topic_id")
    .references(() => topics.id, { onDelete: "cascade" })
    .notNull(),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const files = pgTable("files", {
  id: uuid("id").primaryKey().defaultRandom(),
  originalName: text("original_name").notNull(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  publicUrl: text("url").notNull(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "set null" }),
  processingStatus: text("processing_status", {
    enum: ["pending", "queued", "processing", "completed", "failed"],
  }).default("pending"),
  processingError: text("processing_error"),
  chunkCount: integer("chunk_count").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const documentChunks = pgTable("document_chunks", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id")
    .references(() => courses.id, { onDelete: "cascade" })
    .notNull(),
  fileId: uuid("file_id")
    .references(() => files.id, { onDelete: "cascade" })
    .notNull(),
  chunkText: text("chunk_text").notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  
  // Position metadata
  pageNumber: integer("page_number"), // Track which page this chunk came from
  startPosition: integer("start_position"), // Character position where chunk starts in the document
  endPosition: integer("end_position"), // Character position where chunk ends
  tokenCount: integer("token_count"),
  
  // Structural metadata (NEW for Issue 10)
  headingText: text("heading_text"), // Section/chapter heading for this chunk
  headingLevel: integer("heading_level"), // Heading hierarchy level (1=H1, 2=H2, etc)
  chunkType: text("chunk_type"), // Content type: 'text', 'list', 'table', 'code', 'formula'
  
  // Embedding
  embedding: vector("embedding", { dimensions: 768 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
