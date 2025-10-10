"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";
import type { User } from "@supabase/supabase-js";

export interface UseAuthOptions {
  redirectTo?: string;
  requireAuth?: boolean;
}

export interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

/**
 * Centralized auth hook for client components
 * Now uses Zustand store for state management
 */
export function useAuth(options: UseAuthOptions = {}): UseAuthReturn {
  const { redirectTo = "/signin", requireAuth = false } = options;
  const router = useRouter();

  const {
    user,
    loading,
    isAuthenticated,
    signOut: storeSignOut,
  } = useAuthStore();

  // Handle authentication requirement and redirects
  useEffect(() => {
    // Only redirect if we're done loading and auth is required but user is not authenticated
    if (!loading && requireAuth && !user) {
      console.log("Redirecting to signin - no authenticated user");
      router.replace(redirectTo);
    }
  }, [user, loading, requireAuth, redirectTo, router]);

  // Enhanced sign out with navigation
  const signOut = async () => {
    try {
      await storeSignOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  return {
    user,
    loading,
    signOut,
    isAuthenticated,
  };
}

/**
 * Hook specifically for pages that require authentication
 */
export function useRequireAuth(redirectTo = "/signin"): UseAuthReturn {
  return useAuth({ requireAuth: true, redirectTo });
}

/**
 * Helper function to get display name from user
 */
export function getDisplayName(user: User | null): string {
  if (!user) return "User";

  return (
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "User"
  );
}
