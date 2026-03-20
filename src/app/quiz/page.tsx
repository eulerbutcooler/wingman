import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/services/db/drizzle";
import { courses as coursesTable } from "@/services/db/schema/courses";
import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Course } from "@/types";
import QuizClient from "./QuizClient";
import AviationLoading from "@/components/AviationLoading";

// Force dynamic rendering for auth
export const dynamic = "force-dynamic";

// Cache ALL courses data for 5 minutes (GLOBAL - not user-specific)
const getCachedCourses = unstable_cache(
  async () => {
    try {
      const allCourses = await db
        .select()
        .from(coursesTable)
        .orderBy(desc(coursesTable.createdAt));

      return allCourses as unknown as Course[];
    } catch (error) {
      console.error("Error fetching courses:", error);
      return [];
    }
  },
  ["quiz-courses"],
  {
    revalidate: 300, // 5 minutes
    tags: ["quiz-courses"],
  }
);

// Server component that fetches data
async function QuizData() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/signin");
  }

  const courses = await getCachedCourses();

  return <QuizClient userId={user.id.toString()} initialCourses={courses} />;
}

// Main export with Suspense
export default function QuizPage() {
  return (
    <Suspense fallback={<AviationLoading />}>
      <QuizData />
    </Suspense>
  );
}
