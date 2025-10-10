import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/services/db/drizzle";
import { courses as coursesTable } from "@/services/db/schema/courses";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Course } from "@/types";
import QuizClient from "./QuizClient";

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

// Loading skeleton - matches current quiz UI
function QuizLoading() {
  return (
    <div className="flex flex-col items-center min-h-screen w-full">
      <div className="fixed inset-0 bg-white/40 backdrop-blur-sm"></div>
      <div className="relative z-10 w-full md:w-11/12 mb-10 md:mb-14 px-4 md:px-6 pt-24 md:pt-34">
        {/* Left-aligned heading skeleton */}
        <div>
          <div className="h-7 md:h-8 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-5 md:h-6 w-64 bg-gray-200 rounded animate-pulse mt-2 md:mt-4 mb-4 md:mb-6" />
        </div>

        {/* 4-column grid with rounded-4xl cards */}
        <div className="rounded-2xl md:rounded-4xl w-full py-6 md:py-8 mb-10 md:mb-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="modern-card rounded-2xl md:rounded-4xl overflow-hidden animate-pulse"
              >
                <div className="bg-gray-200 h-32 md:h-40"></div>
                <div className="p-4 md:p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

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
    <Suspense fallback={<QuizLoading />}>
      <QuizData />
    </Suspense>
  );
}
