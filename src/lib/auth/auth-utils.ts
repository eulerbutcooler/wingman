"use server";

import { createClient } from "@/services/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { db } from "@/services/db/drizzle";
import { users } from "@/services/db/schema/users";
import { eq } from "drizzle-orm";
import type { User } from "@supabase/supabase-js";

export interface AuthUser {
  id: number;
  supabaseId: string;
  email: string;
  name: string;
  type: "student" | "admin";
  raw: User;
}

export interface AuthResult {
  success: boolean;
  error?: string;
  message?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    serviceId: string;
    course: string;
  };
  requiresVerification?: boolean;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // Ensure user exists in database
    await ensureUserInDatabase(user);

    // Get the database user record
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.supabaseId, user.id))
      .limit(1);

    if (!dbUser) {
      throw new Error("Failed to sync user to database");
    }

    return {
      id: dbUser.id, // Return the integer database ID
      supabaseId: user.id, // Keep the Supabase ID for reference
      email: user.email || "",
      name:
        user.user_metadata?.name ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "User",
      type: dbUser.type || "student", // Add user type with fallback to student
      raw: user,
    };
  } catch (error) {
    console.error("❌ Get current user error:", error);
    return null;
  }
}

/**
 * Require authentication - throws if not authenticated
 * @returns AuthUser (guaranteed to be authenticated)
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  return user;
}

/**
 * Check if user is authenticated
 * @returns boolean
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Get user session (includes session data)
 */
export async function getUserSession() {
  try {
    const supabase = await createClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      return null;
    }

    return session;
  } catch (error) {
    console.error("❌ Get session error:", error);
    return null;
  }
}

/**
 * Ensure user exists in database (sync from Supabase Auth)
 */
export async function ensureUserInDatabase(
  authUser: User,
  additionalData?: {
    serviceId?: string;
    course?: string;
  }
): Promise<void> {
  try {
    // Check if user already exists by email
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, authUser.email || ""))
      .limit(1);

    if (existingUser.length === 0) {
      // Create user record with supabaseId
      await db.insert(users).values({
        supabaseId: authUser.id, // Use the Supabase Auth user ID
        name:
          authUser.user_metadata?.name ||
          authUser.user_metadata?.full_name ||
          authUser.email?.split("@")[0] ||
          "User",
        email: authUser.email || "",
        course: (additionalData?.course ||
          authUser.user_metadata?.course ||
          "AEO") as "AEO" | "ALO",
        serviceId:
          additionalData?.serviceId || authUser.user_metadata?.service_id,
      });

      console.log("✅ User synced to database:", authUser.email);
    } else {
      // User exists, update their supabaseId if it's missing
      const user = existingUser[0];
      if (!user.supabaseId) {
        await db
          .update(users)
          .set({ supabaseId: authUser.id })
          .where(eq(users.id, user.id));

        console.log(
          "✅ Updated existing user with supabaseId:",
          authUser.email
        );
      } else {
        console.log("✅ User already exists in database:", authUser.email);
      }
    }
  } catch (error) {
    console.error("❌ Error syncing user to database:", error);
    throw error; // Re-throw the error so it's not silently ignored
  }
}

/**
 * Create service role client (for admin operations)
 */
export async function createSupabaseServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Sign up a new user with Supabase
 */
export async function signUpWithSupabase(
  name: string,
  email: string,
  password: string,
  additionalData?: {
    serviceId?: string;
    course?: string;
  }
): Promise<AuthResult> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          serviceId: additionalData?.serviceId,
          course: additionalData?.course,
        },
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message || "Registration failed",
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: "No user data returned",
      };
    }

    // Sync user to database with additional data
    await ensureUserInDatabase(data.user, additionalData);

    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.supabaseId, data.user.id))
      .limit(1);

    if (!dbUser) {
      return {
        success: false,
        error: "Failed to create user record",
      };
    }

    return {
      success: true,
      message: "Account created and signed in successfully!",
      user: {
        id: data.user.id,
        name: data.user.user_metadata?.name || name,
        email: data.user.email || email,
        serviceId: dbUser.serviceId || "",
        course: dbUser.course || "",
      },
    };
  } catch (error) {
    console.error("Supabase sign up error:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Sign in an existing user with Supabase
 */
export async function signInWithSupabase(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error: error.message || "Authentication failed",
      };
    }

    if (!data.user || !data.session) {
      return {
        success: false,
        error: "No user data returned",
      };
    }

    // Sync user to database
    await ensureUserInDatabase(data.user);

    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.supabaseId, data.user.id))
      .limit(1);

    return {
      success: true,
      message: "Successfully signed in",
      user: {
        id: data.user.id,
        name: data.user.user_metadata?.name || data.user.email || "",
        email: data.user.email || "",
        serviceId: dbUser?.serviceId,
        course: dbUser?.course,
      },
    };
  } catch (error) {
    console.error("Supabase sign in error:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Delete user account and all associated data
 */
export async function deleteAccountAction(
  password: string
): Promise<AuthResult> {
  try {
    const supabase = await createClient();

    // Get current user
    const authUser = await getCurrentUser();

    if (!authUser) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    if (!password) {
      return {
        success: false,
        error: "Password is required to delete account",
      };
    }

    // Verify password by attempting to sign in
    const { error: passwordError } = await supabase.auth.signInWithPassword({
      email: authUser.email,
      password: password.trim(),
    });

    if (passwordError) {
      return {
        success: false,
        error: "Invalid password",
      };
    }

    try {
      await db.transaction(async (tx) => {
        await tx.delete(users).where(eq(users.id, authUser.id));
      });
    } catch (dbError) {
      console.error("❌ Database cleanup error:", dbError);
    }

    // Use service role client to delete the user from Supabase Auth
    const serviceSupabase = await createSupabaseServiceClient();
    const { error: deleteError } = await serviceSupabase.auth.admin.deleteUser(
      authUser.supabaseId // Use the Supabase ID for auth deletion
    );

    if (deleteError) {
      console.error("❌ Delete user error:", deleteError);
      return {
        success: false,
        error: "Failed to delete account",
      };
    }

    return {
      success: true,
      message: "Account deleted successfully",
    };
  } catch (error) {
    console.error("💥 Account deletion error:", error);
    return {
      success: false,
      error: "Failed to delete account",
    };
  }
}
