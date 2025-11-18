"use server";

import { db } from "@/services/db/drizzle";
import { users } from "@/services/db/schema/users";
import { quizResults, quizzes } from "@/services/db/schema/quizzes";
import { courses } from "@/services/db/schema/courses";
import { eq, sql, desc } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/auth-utils";

export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) return false;
    return user.type === "admin";
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

export async function getUserType(): Promise<"student" | "admin"> {
  try {
    const user = await getCurrentUser();
    if (!user) return "student";
    return user.type;
  } catch (error) {
    console.error("Error getting user type:", error);
    return "student";
  }
}

export interface StudentAnalytics {
  id: number;
  name: string;
  email: string;
  course: string;
  serviceId: string;
  createdAt: Date | null;
  totalQuizzes: number;
  averageScore: number;
  lastActivityAt: Date | null;
}

export interface StudentDetailedAnalytics extends StudentAnalytics {
  quizAttempts: {
    id: string;
    quizTitle: string;
    score: number;
    totalQuestions: number;
    completedAt: Date | null;
    timeSpent: number | null;
    percentage: number;
  }[];
  coursesEnrolled: {
    id: string;
    title: string;
    createdAt: Date | null;
  }[];
}

export async function getAllStudentsAnalytics(): Promise<StudentAnalytics[]> {
  try {
    const studentsWithStats = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        course: users.course,
        serviceId: users.serviceId,
        createdAt: users.createdAt,
        totalQuizzes: sql<number>`COUNT(DISTINCT ${quizResults.id})::int`,
        averageScore: sql<number>`COALESCE(AVG(${quizResults.score}::float / ${quizResults.totalQuestions}::float * 100), 0)`,
        lastActivityAt: sql<Date>`MAX(${quizResults.completedAt})`,
      })
      .from(users)
      .leftJoin(quizResults, eq(users.id, quizResults.userId))
      .groupBy(users.id)
      .orderBy(desc(users.createdAt));

    return studentsWithStats.map((student) => ({
      ...student,
      averageScore: Math.round(student.averageScore || 0),
    }));
  } catch (error) {
    console.error("Error fetching student analytics:", error);
    throw new Error("Failed to fetch student analytics");
  }
}

export async function getStudentDetailedAnalytics(
  studentId: number
): Promise<StudentDetailedAnalytics | null> {
  try {
    // Get basic student info
    const [student] = await db
      .select()
      .from(users)
      .where(eq(users.id, studentId))
      .limit(1);

    if (!student) {
      return null;
    }

    // Get quiz attempts with quiz titles
    const quizAttempts = await db
      .select({
        id: quizResults.id,
        quizTitle: quizzes.title,
        score: quizResults.score,
        totalQuestions: quizResults.totalQuestions,
        completedAt: quizResults.completedAt,
        timeSpent: quizResults.timeSpent,
      })
      .from(quizResults)
      .innerJoin(quizzes, eq(quizResults.quizId, quizzes.id))
      .where(eq(quizResults.userId, studentId))
      .orderBy(desc(quizResults.completedAt));

    // Get courses enrolled
    const coursesEnrolled = await db
      .select({
        id: courses.id,
        title: courses.title,
        createdAt: courses.createdAt,
      })
      .from(courses)
      .where(eq(courses.userId, studentId))
      .orderBy(desc(courses.createdAt));

    // Calculate statistics
    const totalQuizzes = quizAttempts.length;
    const averageScore =
      totalQuizzes > 0
        ? Math.round(
            quizAttempts.reduce(
              (sum, attempt) =>
                sum + (attempt.score / attempt.totalQuestions) * 100,
              0
            ) / totalQuizzes
          )
        : 0;

    const lastActivityAt =
      quizAttempts.length > 0 ? quizAttempts[0].completedAt : null;

    return {
      id: student.id,
      name: student.name,
      email: student.email,
      course: student.course,
      serviceId: student.serviceId,
      createdAt: student.createdAt,
      totalQuizzes,
      averageScore,
      lastActivityAt,
      quizAttempts: quizAttempts.map((attempt) => ({
        ...attempt,
        percentage: Math.round(
          (attempt.score / attempt.totalQuestions) * 100
        ),
      })),
      coursesEnrolled,
    };
  } catch (error) {
    console.error("Error fetching detailed student analytics:", error);
    throw new Error("Failed to fetch detailed student analytics");
  }
}
