"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores";

/**
 * AuthProvider component that initializes the auth store
 * Should be placed at the root of the app
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return <>{children}</>;
}
