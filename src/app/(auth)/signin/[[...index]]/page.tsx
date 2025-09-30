"use client";

import { useActionState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Toaster, toast } from "sonner";
import { signInWithSupabase, type AuthResult } from "@/lib/auth/auth-utils";
import { useEffect } from "react";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-black text-white font-bold py-3 px-4 rounded-4xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-black transition duration-300 ease-in-out transform hover:scale-101 disabled:opacity-50 disabled:transform-none"
    >
      {pending ? "Signing in..." : "Sign In"}
    </button>
  );
}

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get the redirect URL from query params
  const from = searchParams.get("from") || "/dashboard";

  // Show success message if coming from verification
  useEffect(() => {
    const message = searchParams.get("message");
    if (message === "verification-success") {
      toast.success("Email verified successfully! Please sign in to continue.");
    }
  }, [searchParams]);

  const [state, formAction] = useActionState<AuthResult, FormData>(
    async (previousState, formData) => {
      const serviceId = formData.get("service_id") as string;
      const password = formData.get("password") as string;

      if (!serviceId || !password) {
        return {
          success: false,
          error: "Service no. and password are required",
        };
      }

      const result = await signInWithSupabase(password, { serviceId });

      if (result.success) {
        toast.success("Welcome back!");
        router.push(from);
        router.refresh();
      } else if (result.error) {
        toast.error(result.error);
      }

      return result;
    },
    { success: false }
  );

  return (
    <div className="flex items-center w-[100vw] justify-center px-2  min-h-screen bg-[#f5f5f5]">
      {/* Main container for the signin form */}
      <div className="bg-white text-black w-lg  mx-4 p-10 rounded-4xl shadow-sm ">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-black">
            Welcome Back
          </h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        {/* Signin Form */}
        <form action={formAction}>
          <div className="space-y-6">
            {/* Email Input */}
            {/* <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-600 mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="email@example.com"
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-4xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition duration-300"
              />
            </div> */}
            <div>
              <label
                htmlFor="service_id"
                className="block text-sm font-medium text-gray-600 mb-2"
              >
                Service No.
              </label>
              <input
                type="text"
                id="service_id"
                name="service_id"
                placeholder="Enter your service number"
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-4xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition duration-300"
              />
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-600 mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-4xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition duration-300"
              />
            </div>
          </div>

          {/* Error Message */}
          {state.error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{state.error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="mt-8">
            <SubmitButton />
          </div>
        </form>

        {/* Footer Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Don&apos;t have an account?
            <Link
              href="/signup"
              className="font-medium text-black hover:underline ml-1"
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
