import { relations } from "drizzle-orm/relations";
import { courses, topics, quizzes, users, files, chats, messages, documentChunks, lessons, quizResults } from "./schema";

export const topicsRelations = relations(topics, ({one, many}) => ({
	course: one(courses, {
		fields: [topics.courseId],
		references: [courses.id]
	}),
	lessons: many(lessons),
}));

export const coursesRelations = relations(courses, ({one, many}) => ({
	topics: many(topics),
	quizzes: many(quizzes),
	documentChunks: many(documentChunks),
	user: one(users, {
		fields: [courses.userId],
		references: [users.id]
	}),
}));

export const quizzesRelations = relations(quizzes, ({one, many}) => ({
	course: one(courses, {
		fields: [quizzes.courseId],
		references: [courses.id]
	}),
	user: one(users, {
		fields: [quizzes.userId],
		references: [users.id]
	}),
	quizResults: many(quizResults),
}));

export const usersRelations = relations(users, ({many}) => ({
	quizzes: many(quizzes),
	files: many(files),
	chats: many(chats),
	quizResults: many(quizResults),
	courses: many(courses),
}));

export const filesRelations = relations(files, ({one, many}) => ({
	user: one(users, {
		fields: [files.userId],
		references: [users.id]
	}),
	documentChunks: many(documentChunks),
	lessons: many(lessons),
}));

export const chatsRelations = relations(chats, ({one, many}) => ({
	user: one(users, {
		fields: [chats.userId],
		references: [users.id]
	}),
	messages: many(messages),
}));

export const messagesRelations = relations(messages, ({one}) => ({
	chat: one(chats, {
		fields: [messages.chatId],
		references: [chats.id]
	}),
}));

export const documentChunksRelations = relations(documentChunks, ({one}) => ({
	course: one(courses, {
		fields: [documentChunks.courseId],
		references: [courses.id]
	}),
	file: one(files, {
		fields: [documentChunks.fileId],
		references: [files.id]
	}),
}));

export const lessonsRelations = relations(lessons, ({one}) => ({
	file: one(files, {
		fields: [lessons.fileId],
		references: [files.id]
	}),
	topic: one(topics, {
		fields: [lessons.topicId],
		references: [topics.id]
	}),
}));

export const quizResultsRelations = relations(quizResults, ({one}) => ({
	quiz: one(quizzes, {
		fields: [quizResults.quizId],
		references: [quizzes.id]
	}),
	user: one(users, {
		fields: [quizResults.userId],
		references: [users.id]
	}),
}));