import { pgTable, unique, integer, uuid, text, timestamp, foreignKey, jsonb, index, check, vector, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const courseType = pgEnum("course_type", ['AEO', 'ALO'])
export const userType = pgEnum("user_type", ['student', 'admin'])


export const users = pgTable("users", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "users_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	supabaseId: uuid("supabase_id").notNull(),
	name: text().notNull(),
	email: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	course: courseType().notNull(),
	serviceId: text("service_id").notNull(),
	type: userType().default('student').notNull(),
}, (table) => [
	unique("users_supabase_id_unique").on(table.supabaseId),
	unique("users_email_unique").on(table.email),
	unique("users_service_id_unique").on(table.serviceId),
]);

export const topics = pgTable("topics", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	courseId: uuid("course_id").notNull(),
	order: integer().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: "topics_course_id_courses_id_fk"
		}).onDelete("cascade"),
]);

export const quizzes = pgTable("quizzes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	description: text(),
	courseId: uuid("course_id").notNull(),
	userId: integer("user_id").notNull(),
	difficulty: text().notNull(),
	totalQuestions: integer("total_questions").notNull(),
	questions: jsonb().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: "quizzes_course_id_courses_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "quizzes_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const files = pgTable("files", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	originalName: text("original_name").notNull(),
	filename: text().notNull(),
	mimeType: text("mime_type").notNull(),
	size: integer().notNull(),
	userId: integer("user_id").notNull(),
	processingStatus: text("processing_status").default('pending'),
	processingError: text("processing_error"),
	chunkCount: integer("chunk_count").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	url: text().notNull(),
}, (table) => [
	index("idx_files_status").using("btree", table.processingStatus.asc().nullsLast().op("text_ops"), table.createdAt.desc().nullsFirst().op("text_ops")),
	index("idx_files_user").using("btree", table.userId.asc().nullsLast().op("int4_ops"), table.createdAt.desc().nullsFirst().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "files_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const chats = pgTable("chats", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	userId: integer("user_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "chats_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const messages = pgTable("messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	chatId: uuid("chat_id").notNull(),
	role: text().notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.chatId],
			foreignColumns: [chats.id],
			name: "messages_chat_id_chats_id_fk"
		}).onDelete("cascade"),
]);

export const documentChunks = pgTable("document_chunks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	courseId: uuid("course_id").notNull(),
	fileId: uuid("file_id").notNull(),
	chunkText: text("chunk_text").notNull(),
	chunkIndex: integer("chunk_index").notNull(),
	tokenCount: integer("token_count"),
	embedding: vector({ dimensions: 768 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	pageNumber: integer("page_number"),
	startPosition: integer("start_position"),
	endPosition: integer("end_position"),
	searchVector: text("search_vector"),
	contentHash: text("content_hash"),
	headingText: text("heading_text"),
	headingLevel: integer("heading_level"),
	chunkType: text("chunk_type"),
}, (table) => [
	index("idx_document_chunks_course_file").using("btree", table.courseId.asc().nullsLast().op("uuid_ops"), table.fileId.asc().nullsLast().op("uuid_ops")),
	index("idx_document_chunks_embedding").using("hnsw", table.embedding.asc().nullsLast().op("vector_cosine_ops")).with({m: "16",ef_construction: "64"}),
	index("idx_document_chunks_file_index").using("btree", table.fileId.asc().nullsLast().op("int4_ops"), table.chunkIndex.asc().nullsLast().op("int4_ops")),
	index("idx_document_chunks_fts").using("gin", sql`to_tsvector('english'::regconfig, chunk_text)`),
	index("idx_document_chunks_type").using("btree", table.chunkType.asc().nullsLast().op("text_ops")).where(sql`(chunk_type IS NOT NULL)`),
	foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: "document_chunks_course_id_courses_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.fileId],
			foreignColumns: [files.id],
			name: "document_chunks_file_id_files_id_fk"
		}).onDelete("cascade"),
	check("check_chunk_type", sql`(chunk_type IS NULL) OR (chunk_type = ANY (ARRAY['text'::text, 'list'::text, 'table'::text, 'code'::text, 'formula'::text]))`),
	check("check_heading_level", sql`(heading_level IS NULL) OR ((heading_level >= 1) AND (heading_level <= 6))`),
	check("check_token_count", sql`(token_count IS NULL) OR (token_count > 0)`),
]);

export const lessons = pgTable("lessons", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	type: text().notNull(),
	fileId: uuid("file_id"),
	topicId: uuid("topic_id").notNull(),
	order: integer().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.fileId],
			foreignColumns: [files.id],
			name: "lessons_file_id_files_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.topicId],
			foreignColumns: [topics.id],
			name: "lessons_topic_id_topics_id_fk"
		}).onDelete("cascade"),
]);

export const quizResults = pgTable("quiz_results", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	quizId: uuid("quiz_id").notNull(),
	userId: integer("user_id").notNull(),
	score: integer().notNull(),
	totalQuestions: integer("total_questions").notNull(),
	answers: jsonb().notNull(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	timeSpent: integer("time_spent"),
}, (table) => [
	foreignKey({
			columns: [table.quizId],
			foreignColumns: [quizzes.id],
			name: "quiz_results_quiz_id_quizzes_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "quiz_results_user_id_users_id_fk"
		}).onDelete("cascade"),
]);

export const courses = pgTable("courses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: text().notNull(),
	description: text().notNull(),
	imageUrl: text("image_url"),
	userId: integer("user_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	gendesc: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "courses_user_id_users_id_fk"
		}).onDelete("cascade"),
]);
