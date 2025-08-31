import { pgTable, uuid, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';
import { courses } from './courses';

// Quizzes table - Each quiz is associated with a course
export const quizzes = pgTable('quizzes', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  difficulty: text('difficulty', { enum: ['easy', 'medium', 'hard'] }).notNull(),
  totalQuestions: integer('total_questions').notNull(),
  questions: jsonb('questions').notNull(), // Array of question objects
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Quiz Results table - Stores user attempts and scores
export const quizResults = pgTable('quiz_results', {
  id: uuid('id').primaryKey().defaultRandom(),
  quizId: uuid('quiz_id').references(() => quizzes.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  score: integer('score').notNull(),
  totalQuestions: integer('total_questions').notNull(),
  answers: jsonb('answers').notNull(), // User's answers
  completedAt: timestamp('completed_at', { withTimezone: true }).defaultNow(),
  timeSpent: integer('time_spent'), // in seconds
});

export type Quiz = typeof quizzes.$inferSelect;
export type NewQuiz = typeof quizzes.$inferInsert;
export type QuizResult = typeof quizResults.$inferSelect;
export type NewQuizResult = typeof quizResults.$inferInsert;
