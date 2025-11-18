import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { redirect } from "next/navigation";
import AnalyticsClient from "./AnalyticsClient";
import { getAllStudentsAnalytics } from "@/lib/actions/analytics/analytics-actions";

// Force dynamic rendering (required for auth with cookies)
export const dynamic = "force-dynamic";

// Loading skeleton component
function AnalyticsLoading() {
  return (
    <div className="flex flex-col items-center min-h-screen w-full">
      <div className="fixed inset-0 bg-white/40 backdrop-blur-sm"></div>
      <div className="relative z-10 w-full md:w-11/12 mb-10 md:mb-14 px-4 md:px-6 pt-24 md:pt-34">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-48 bg-gray-300 rounded-2xl md:rounded-4xl"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Server component that fetches data
async function AnalyticsData() {
  // Get current user (server-side)
  const user = await getCurrentUser();

  if (!user?.id) {
    redirect("/signin");
  }

  // Check if user is admin
  if (user.type !== "admin") {
    redirect("/dashboard");
  }

  // Fetch students data
  const students = await getAllStudentsAnalytics();

  // Pass data to client component
  return <AnalyticsClient initialStudents={students} />;
}

// Main page component (Server Component with Suspense)
export default async function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsLoading />}>
      <AnalyticsData />
    </Suspense>
  );
}
