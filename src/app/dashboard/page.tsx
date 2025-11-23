"use client";

import React, { useState, useActionState } from "react";
import { deleteAccountAction, AuthResult } from "@/lib/auth/auth-utils";
import { useRequireAuth, getDisplayName } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";

import { FaArrowRight } from "react-icons/fa";
import { PiTimer } from "react-icons/pi";
import { IoBookOutline } from "react-icons/io5";
import { AiOutlineThunderbolt } from "react-icons/ai";

function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? "Deleting..." : "Delete Account"}
    </button>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, signOut } = useRequireAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const [deleteState, deleteFormAction] = useActionState<AuthResult, FormData>(
    async (previousState, formData) => {
      if (deleteConfirmText !== "DELETE") {
        return { success: false, error: 'Please type "DELETE" to confirm' };
      }

      const password = formData.get("password") as string;
      if (!password) {
        return { success: false, error: "Password is required" };
      }

      const result = await deleteAccountAction(password);
      if (result.success) {
        await signOut();
      }

      return result;
    },
    { success: false }
  );

  const resetDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteConfirmText("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-slate-50">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 mix-blend-soft-light"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-transparent via-50% to-slate-50"></div>
      </div>
      <div className="relative z-10 flex flex-col justify-center items-center pt-24 md:pt-34">
        <div className="w-full md:w-11/12 p-4 md:p-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">
              Welcome to your Dashboard,{" "}
              <span className="text-blue-600">{getDisplayName(user)}!</span>
            </h1>
            <p className="text-slate-600 mb-8 text-sm sm:text-base">
              You have successfully signed in to your account.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white p-4 sm:p-6 transition-all duration-300 rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(37,99,235,0.1)] group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl">💬</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">Chat</h3>
                </div>
                <p className="text-slate-600 mb-4 text-sm sm:text-base font-medium">
                  Start a conversation with AI
                </p>
                <button
                  onClick={() => router.push("/chat")}
                  className="bg-blue-600 text-white flex items-center gap-2 px-6 py-3 cursor-pointer rounded-xl hover:bg-blue-700 transition-all duration-300 w-full sm:w-auto justify-center sm:justify-start"
                >
                  Go to chat
                  <FaArrowRight className="inline-block ml-2 transition-transform group-hover:translate-x-1" />
                </button>
              </div>

              <div className="bg-white p-4 sm:p-6 transition-all duration-300 rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(37,99,235,0.1)] group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl">📚</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">Library</h3>
                </div>
                <p className="text-slate-600 mb-4 text-sm sm:text-base font-medium">
                  Access your document library
                </p>
                <button
                  onClick={() => router.push("/library")}
                  className="bg-blue-600 text-white px-6 flex items-center gap-2 py-3 cursor-pointer rounded-xl hover:bg-blue-700 transition-all duration-300 w-full sm:w-auto justify-center sm:justify-start"
                >
                  View library
                  <FaArrowRight className="inline-block ml-2 transition-transform group-hover:translate-x-1" />
                </button>
              </div>

              <div className="bg-white p-4 sm:p-6 transition-all duration-300 rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(37,99,235,0.1)] sm:col-span-2 lg:col-span-1 group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl">🧠</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">Quizzes</h3>
                </div>
                <p className="text-slate-600 mb-4 text-sm sm:text-base font-medium">
                  Explore challenging quizzes
                </p>
                <button
                  onClick={() => router.push("/quiz")}
                  className="bg-blue-600 text-white flex gap-2 items-center px-6 py-3 cursor-pointer rounded-xl hover:bg-blue-700 transition-all duration-300 w-full sm:w-auto justify-center sm:justify-start"
                >
                  Start quiz
                  <FaArrowRight className="inline-block ml-2 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            {/* Mobile: Stack vertically, Desktop: Side by side */}
            <div className="flex flex-col lg:flex-row mt-8 gap-4 sm:gap-8">
              <div className="bg-white p-4 sm:p-6 flex-col flex justify-between flex-1 rounded-3xl border border-blue-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="text-xl sm:text-2xl font-semibold text-slate-900 mb-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">👤</span>
                  </div>
                  Account Information
                </div>
                <div className="space-y-3 pt-2">
                  <p className="text-slate-600 text-sm sm:text-xl">
                    <span className="font-medium text-slate-900">Name:</span>{" "}
                    {getDisplayName(user)}
                  </p>
                  <p className="text-slate-600 text-sm sm:text-xl">
                    <span className="font-medium text-slate-900">Service No:</span>{" "}
                    {user.user_metadata?.serviceId || "N/A"}
                  </p>
                  <p className="text-slate-600 text-sm sm:text-xl">
                    <span className="font-medium text-slate-900">Course:</span>{" "}
                    {user.user_metadata?.course || "N/A"}
                  </p>
                </div>
              </div>
              <div className="p-4 sm:p-6 rounded-3xl bg-white transition-all flex flex-col duration-300 border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">
                  Your learning snapshot
                </h3>
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  <div className="flex items-center rounded-2xl border border-slate-200 hover:border-blue-300 transition-all duration-300 p-3 sm:p-4 px-4 sm:px-8 gap-3">
                    <PiTimer className="text-2xl sm:text-3xl text-slate-900 mr-2" />
                    <div className="flex flex-col">
                      <p className="text-base sm:text-lg font-semibold text-slate-900">
                        7.2 Hours
                      </p>
                      <p className="text-slate-600 text-sm sm:text-base">
                        This week
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center rounded-2xl border border-slate-200 hover:border-blue-300 transition-all duration-300 p-3 sm:p-4 px-4 sm:px-8 gap-3">
                    <IoBookOutline className="text-2xl sm:text-3xl text-slate-900 mr-2" />
                    <div className="flex flex-col">
                      <p className="text-base sm:text-lg font-semibold text-slate-900">
                        12 Lessons
                      </p>
                      <p className="text-slate-600 text-sm sm:text-base">
                        Completed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center rounded-2xl border border-slate-200 hover:border-blue-300 transition-all duration-300 p-3 sm:p-4 px-4 sm:px-8 gap-3">
                    <AiOutlineThunderbolt className="text-2xl sm:text-3xl text-slate-900 mr-2" />
                    <div className="flex flex-col">
                      <p className="text-base sm:text-lg font-semibold text-slate-900">
                        4 Days
                      </p>
                      <p className="text-slate-600 text-sm sm:text-base">Streak</p>
                    </div>
                  </div>
                </div>
                {/* <div className="p-4 sm:p-6 rounded-4xl shadow-sm hover:shadow-xl bg-white gap-2 flex flex-col transition-all duration-300">
                <h3 className="text-lg font-semibold text-black">
                  Recent activity
                </h3>
                <p className="text-navy pt-2 text-sm sm:text-base">
                  This is a sample activity in under 1 line
                </p>
                <p className="text-navy text-sm sm:text-base">This is sample activity 2 </p>
                <p className="text-navy text-sm sm:text-base">This is sample activity 3 </p>
                <p className="text-navy text-sm sm:text-base">This is sample activity 4 </p>
              </div> */}
              </div>

              {/* Mobile: Single column, Desktop: Multi-column layout */}
              <div className="flex flex-col lg:flex-row justify-between gap-4 sm:gap-8 mt-8"></div>

              {/* Mobile: Full width, Desktop: Sidebar */}
              <div className="flex justify-between p-4 flex-col lg:max-w-sm w-full lg:w-auto">
                <button
                  onClick={signOut}
                  className="rounded-xl w-full bg-slate-900 text-white px-4 sm:px-6 py-3 sm:py-4 cursor-pointer text-lg sm:text-xl hover:bg-slate-800 transition-colors"
                >
                  Log out
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="rounded-xl bg-red-50 border border-red-200 hover:bg-red-500 transition-all duration-150 cursor-pointer text-red-600 hover:text-white px-4 sm:px-6 py-3 sm:py-4 text-lg sm:text-xl mt-4"
                >
                  Delete account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 border border-slate-200 shadow-[0_20px_50px_rgb(0,0,0,0.3)]">
            <h2 className="text-xl font-bold text-red-600 mb-4">
              Delete Account
            </h2>
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-800 text-sm">
                <strong>Warning:</strong> This action cannot be undone. This
                will permanently delete your account and all associated data.
              </p>
            </div>

            <form action={deleteFormAction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Confirm by typing &quot;DELETE&quot;:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900"
                  placeholder="Type DELETE to confirm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Enter your password to confirm:
                </label>
                <input
                  type="password"
                  name="password"
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-slate-900"
                  placeholder="Enter your password"
                  required
                />
              </div>

              {deleteState?.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm">{deleteState.error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetDeleteModal}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <DeleteButton />
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
