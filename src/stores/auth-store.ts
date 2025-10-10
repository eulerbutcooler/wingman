import { create } from "zustand";
import { createClient } from "@/services/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setLoading: (loading) => set({ loading }),

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

      // Listen for auth state changes
      supabase.auth.onAuthStateChange((_event, session) => {
        console.log("Auth state changed:", _event, !!session?.user);
        set({
          user: session?.user ?? null,
          isAuthenticated: !!session?.user,
          loading: false,
        });
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
      set({ user: null, isAuthenticated: false });
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  },
}));
