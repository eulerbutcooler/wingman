import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { redirect } from "next/navigation";
import AnalyticsClient from "./AnalyticsClient";
import { getAllStudentsAnalytics } from "@/lib/actions/analytics/analytics-actions";
import AviationLoading from "@/components/AviationLoading";

// Force dynamic rendering (required for auth with cookies)
export const dynamic = "force-dynamic";

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
    <Suspense fallback={<AviationLoading />}>
      <AnalyticsData />
    </Suspense>
  );
}
