// Server-side auth utilities
export * from "./auth-utils";

// Client-side auth hooks
export * from "../../hooks/use-auth";

// Re-export specific functions for convenience
export {
  getCurrentUser,
  requireAuth,
  isAuthenticated,
  signUpWithSupabase,
  signInWithSupabase,
  deleteAccountAction,
} from "./auth-utils";
