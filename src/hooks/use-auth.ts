"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/services/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface UseAuthOptions {
  redirectTo?: string; // Where to redirect if not authenticated
  requireAuth?: boolean; // Whether to require authentication
}

export interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

/**
 * Centralized auth hook for client components
 * Handles authentication state, redirects, and provides auth utilities
 */
export function useAuth(options: UseAuthOptions = {}): UseAuthReturn {
  const { redirectTo = "/signin", requireAuth = false } = options;

  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("❌ Error getting session:", error);
      }

      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Auth state changed:", event, session?.user?.email);

      setUser(session?.user ?? null);
      setLoading(false);

      // Handle different auth events
      switch (event) {
        case "SIGNED_IN":
          console.log("✅ User signed in:", session?.user?.email);
          break;
        case "SIGNED_OUT":
          console.log("👋 User signed out");
          setUser(null);
          break;
        case "TOKEN_REFRESHED":
          console.log("🔄 Token refreshed for:", session?.user?.email);
          break;
        case "USER_UPDATED":
          console.log("👤 User updated:", session?.user?.email);
          break;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Handle authentication requirement and redirects
  useEffect(() => {
    if (!loading) {
      if (requireAuth && !user) {
        console.log("🔒 Auth required, redirecting to:", redirectTo);
        router.replace(redirectTo);
      }
    }
  }, [user, loading, requireAuth, redirectTo, router]);

  // Sign out function
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("❌ Error signing out:", error);
    }
  };

  return {
    user,
    loading,
    signOut,
    isAuthenticated: !!user,
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
