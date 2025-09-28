"use client";

import React, { useState, useActionState } from "react";
// --- IMPORTS ---
import { deleteAccountAction, AuthResult } from "@/lib/auth/auth-utils";
import { useRequireAuth, getDisplayName } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";

// --- ICONS (Unchanged) ---
import { FaArrowRight } from "react-icons/fa";
import { PiTimer } from "react-icons/pi";
import { IoBookOutline } from "react-icons/io5";
import { AiOutlineThunderbolt } from "react-icons/ai";

// --- NEW COMPONENT ---
function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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
    return null; // Will redirect via useRequireAuth hook
  }

  return (
    <div className="min-h-screen w-full bg-[#f5f5f5]">
      <div className="mx-auto w-full sm:w-11/12 px-4 sm:px-6 pt-24 sm:pt-34 pb-12">
        <div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-black mb-4">
              Welcome to your Dashboard,{" "}
              <span className="text-navy">{getDisplayName(user)}!</span>
            </h1>
            <p className="text-neutral-600 mb-8 text-sm sm:text-base">
              You have successfully signed in to your account.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="shadow-sm p-4 sm:p-6 hover:shadow-xl bg-white transition-all duration-300 rounded-4xl">
                <h3 className="text-lg font-semibold text-black mb-2">Chat</h3>
                <p className="text-navy mb-4 text-sm sm:text-base">
                  Start a conversation with AI
                </p>
                <button
                  onClick={() => router.push("/chat")}
                  className="bg-black text-white flex items-center gap-2 px-4 py-2 cursor-pointer rounded-4xl hover:bg-gray-800 transition-colors w-full sm:w-auto justify-center sm:justify-start"
                >
                  Go to chat
                  <FaArrowRight className="inline-block ml-2" />
                </button>
              </div>

              <div className="shadow-sm p-4 sm:p-6 hover:shadow-xl bg-white transition-all duration-300 rounded-4xl">
                <h3 className="text-lg font-semibold text-black mb-2">
                  Library
                </h3>
                <p className="text-navy mb-4 text-sm sm:text-base">
                  Access your document library
                </p>
                <button
                  onClick={() => router.push("/library")}
                  className="bg-black text-white px-4 flex items-center gap-2 py-2 cursor-pointer rounded-4xl hover:bg-gray-800 transition-colors w-full sm:w-auto justify-center sm:justify-start"
                >
                  View library
                  <FaArrowRight className="inline-block ml-2" />
                </button>
              </div>

              <div className="shadow-sm p-4 sm:p-6 hover:shadow-xl bg-white transition-all duration-300 rounded-4xl sm:col-span-2 lg:col-span-1">
                <h3 className="text-lg font-semibold text-black mb-2">
                  Quizzes
                </h3>
                <p className="text-navy mb-4 text-sm sm:text-base">
                  Explore challenging quizzes
                </p>
                <button
                  onClick={() => router.push("/quiz")}
                  className="bg-black text-white flex gap-2 items-center px-4 py-2 cursor-pointer rounded-4xl hover:bg-gray-800 transition-colors w-full sm:w-auto justify-center sm:justify-start"
                >
                  Start quiz
                  <FaArrowRight className="inline-block ml-2" />
                </button>
              </div>
            </div>

            {/* Mobile: Stack vertically, Desktop: Side by side */}
            <div className="flex flex-col lg:flex-row mt-8 gap-4 sm:gap-8">
              <div className="bg-white p-4 sm:p-6 flex-col flex justify-between flex-1 rounded-4xl shadow-sm">
                <div className="text-xl sm:text-2xl font-semibold text-black">
                  Account Information
                </div>
                <div className="space-y-2 pt-2">
                  <p className="text-navy text-sm sm:text-xl">
                    <span className="font-medium text-black">Name:</span>{" "}
                    {getDisplayName(user)}
                  </p>
                  {/* <p className="text-navy text-sm sm:text-xl">
                    <span className="font-medium text-black">Email:</span>{" "}
                    {user.email}
                  </p> */}
                  <p className="text-navy text-xs sm:text-xl break-all">
                    <span className="font-medium text-black">Course:</span>{" "}
                    {user.user_metadata?.course || ""}
                  </p>
                  <p className="text-navy text-xs sm:text-xl break-all">
                    <span className="font-medium text-black">Service No:</span>{" "}
                    {user.user_metadata?.serviceId || ""}
                  </p>
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
            <div className="flex flex-col lg:flex-row justify-between gap-4 sm:gap-8 mt-8">
              <div className="p-4 sm:p-6 rounded-4xl bg-white transition-all flex flex-col duration-300 shadow-sm">
                <h3 className="text-lg font-semibold text-black mb-4">
                  Your learning snapshot
                </h3>
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  <div className="flex items-center rounded-4xl shadow-sm hover:shadow-xl transition-all duration-300 p-3 sm:p-4 px-4 sm:px-8 gap-3">
                    <PiTimer className="text-2xl sm:text-3xl text-black mr-2" />
                    <div className="flex flex-col">
                      <p className="text-base sm:text-lg font-semibold">
                        7.2 Hours
                      </p>
                      <p className="text-navy text-sm sm:text-base">
                        This week
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center rounded-4xl shadow-sm hover:shadow-xl transition-all duration-300 p-3 sm:p-4 px-4 sm:px-8 gap-3">
                    <IoBookOutline className="text-2xl sm:text-3xl text-black mr-2" />
                    <div className="flex flex-col">
                      <p className="text-base sm:text-lg font-semibold">
                        12 Lessons
                      </p>
                      <p className="text-navy text-sm sm:text-base">
                        Completed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center rounded-4xl shadow-sm hover:shadow-xl transition-all duration-300 p-3 sm:p-4 px-4 sm:px-8 gap-3">
                    <AiOutlineThunderbolt className="text-2xl sm:text-3xl text-black mr-2" />
                    <div className="flex flex-col">
                      <p className="text-base sm:text-lg font-semibold">
                        4 Days
                      </p>
                      <p className="text-navy text-sm sm:text-base">Streak</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile: Full width, Desktop: Sidebar */}
              <div className="flex justify-between p-4 flex-col lg:max-w-sm w-full lg:w-auto">
                <button
                  onClick={signOut}
                  className="rounded-4xl w-full bg-black text-white px-4 sm:px-6 py-3 sm:py-4 cursor-pointer text-lg sm:text-xl hover:bg-gray-800 transition-colors"
                >
                  Log out
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="rounded-4xl bg-red-500/20 border border-red-500/20 hover:bg-red-500 transition-all duration-150 cursor-pointer text-red-600 hover:text-white px-4 sm:px-6 py-3 sm:py-4 text-lg sm:text-xl mt-4"
                >
                  Delete account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-red-600 mb-4">
              Delete Account
            </h2>
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">
                <strong>Warning:</strong> This action cannot be undone. This
                will permanently delete your account and all associated data.
              </p>
            </div>

            <form action={deleteFormAction} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm by typing &quot;DELETE&quot;:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Type DELETE to confirm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your password to confirm:
                </label>
                <input
                  type="password"
                  name="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
              </div>

              {deleteState?.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{deleteState.error}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetDeleteModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
