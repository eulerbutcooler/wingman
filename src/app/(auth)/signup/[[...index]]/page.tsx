"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Toaster, toast } from "sonner";
import { signUpWithSupabase, type AuthResult } from "@/lib/auth/auth-utils";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-black text-white font-bold py-3 px-4 rounded-4xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-black transition duration-300 ease-in-out transform hover:scale-101 disabled:opacity-50 disabled:transform-none"
    >
      {pending ? "Creating Account..." : "Create Account"}
    </button>
  );
}

export default function SignUpPage() {
  const router = useRouter();

  const [state, formAction] = useActionState<AuthResult, FormData>(
    async (previousState, formData) => {
      const name = formData.get("name") as string;
      const email = formData.get("email") as string;
      const serviceId = formData.get("service_id") as string;
      const course = formData.get("course") as string;
      const password = formData.get("password") as string;
      const confirmPassword = formData.get("confirmPassword") as string;

      // Client-side validation
      if (!name || !serviceId || !course || !password || !confirmPassword) {
        return { success: false, error: "All fields are required" };
      }

      if (password !== confirmPassword) {
        return { success: false, error: "Passwords do not match" };
      }

      if (password.length < 6) {
        return {
          success: false,
          error: "Password must be at least 6 characters long",
        };
      }

      const result = await signUpWithSupabase(name, password, {
        serviceId: serviceId,
        course: course,
      });

      if (result.success) {
        toast.success("Account created and signed in successfully!");
        setTimeout(() => router.push("/dashboard"), 2000);
        return { success: true, error: undefined };
      } else {
        toast.error(result.error);
        return { success: false, error: result.error };
      }
    },
    { success: false, error: undefined }
  );

  return (
    <div className="flex items-center w-[100vw] justify-center pt-6 px-2 min-h-screen bg-[#f5f5f5]">
      {/* Main container for the signup form */}
      <div className="bg-white text-black w-xl  mx-4 p-10 rounded-4xl shadow-sm ">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold  text-black">Create Account</h1>
          <p className="text-gray-600 mt-2">Join our community today!</p>
        </div>

        {/* Signup Form */}
        <form action={formAction}>
          <div className="space-y-6">
            {/* Full Name Input */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-600 mb-2"
              >
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="enter your name"
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-4xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition duration-300"
              />
            </div>

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
                placeholder="enter your service number"
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-4xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition duration-300"
              />
            </div>

            {/* Course Selection Dropdown */}
            <div>
              <label
                htmlFor="course"
                className="block text-sm font-medium text-gray-600 mb-2"
              >
                Course
              </label>
              <div className="relative">
                <select
                  id="course"
                  name="course"
                  required
                  defaultValue=""
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-4xl text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition duration-300 appearance-none cursor-pointer pr-12"
                >
                  <option value="" disabled className="text-gray-400">
                    select your course
                  </option>
                  <option value="AEO" className="text-black">
                    AEO
                  </option>
                  <option value="ALO" className="text-black">
                    ALO
                  </option>
                </select>
                {/* Custom dropdown arrow */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

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

            {/* Password Input */}
            <div className="flex gap-2 justify-between">
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

            {/* Confirm Password Input */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-600 mb-2"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-4xl text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition duration-300"
              />
            </div>
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
            Already have an account?
            <Link
              href="/signin"
              className="font-medium text-black hover:underline ml-1"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
