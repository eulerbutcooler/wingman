import { signOut } from "next-auth/react";

// Authentication utility functions for client-side usage

export interface DeleteAccountData {
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Sign out the current user and redirect to home page
 */
export async function signOutUser(redirectUrl: string = "/"): Promise<void> {
  try {
    // Call custom signout endpoint for any additional cleanup
    await fetch("/api/auth/signout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Use NextAuth signOut to clear the session
    await signOut({
      callbackUrl: redirectUrl,
      redirect: true,
    });
  } catch (error) {
    console.error("Signout error:", error);
    // Fallback to NextAuth signout even if custom endpoint fails
    await signOut({
      callbackUrl: redirectUrl,
      redirect: true,
    });
  }
}

/**
 * Delete the current user's account
 */
export async function deleteAccount(data: DeleteAccountData): Promise<AuthResponse> {
  try {
    const response = await fetch("/api/auth/delete-account", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to delete account");
    }

    // Sign out after successful account deletion
    await signOut({
      callbackUrl: "/",
      redirect: true,
    });

    return result;
  } catch (error) {
    console.error("Account deletion error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete account",
    };
  }
}

/**
 * Check if user is authenticated
 */
export async function checkAuthStatus(): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/session");
    const session = await response.json();
    return !!session?.user;
  } catch (error) {
    console.error("Auth status check error:", error);
    return false;
  }
}
