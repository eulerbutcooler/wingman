import { create } from "zustand";
import { createClient } from "@/services/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  userType: "student" | "admin" | null;
  loading: boolean;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setUserType: (userType: "student" | "admin" | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchUserType: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userType: null,
  loading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setUserType: (userType) => set({ userType }),

  setLoading: (loading) => set({ loading }),

  fetchUserType: async () => {
    const { user } = get();
    if (!user) {
      set({ userType: null });
      return;
    }

    try {
      // Call server action to get user type
      const { getUserType } = await import("@/lib/actions/analytics/analytics-actions");
      const userType = await getUserType();
      set({ userType });
    } catch (error) {
      console.error("Error fetching user type:", error);
      set({ userType: "student" });
    }
  },

  initialize: async () => {
    const supabase = createClient();

    try {
      // Get initial session
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error getting session:", error);
      }

      set({
        user: session?.user ?? null,
        isAuthenticated: !!session?.user,
        loading: false,
      });

      // Fetch user type if user exists
      if (session?.user) {
        get().fetchUserType();
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange((_event, session) => {
        console.log("Auth state changed:", _event, !!session?.user);
        set({
          user: session?.user ?? null,
          isAuthenticated: !!session?.user,
          loading: false,
        });

        // Fetch user type when user signs in
        if (session?.user) {
          get().fetchUserType();
        } else {
          set({ userType: null });
        }
      });
    } catch (error) {
      console.error("Error initializing auth:", error);
      set({ loading: false });
    }
  },

  signOut: async () => {
    const supabase = createClient();
    try {
      await supabase.auth.signOut();
      set({ user: null, userType: null, isAuthenticated: false });
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  },
}));
