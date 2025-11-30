"use client";

import React, { useState } from "react";
import { FaPlus } from "react-icons/fa6";
import * as courseService from "@/services/course-service";

interface AddTopicButtonProps {
  courseId: string;
  onSuccess?: () => void;
}

export default function AddTopicButton({
  courseId,
  onSuccess,
}: AddTopicButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [topicTitle, setTopicTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topicTitle.trim()) {
      setError("Topic title is required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await courseService.createTopic(topicTitle.trim(), courseId);
      
      // Reset and close
      setTopicTitle("");
      setIsOpen(false);
      
      // Notify parent
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error("Failed to create topic:", err);
      setError(err instanceof Error ? err.message : "Failed to create topic");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setIsOpen(false);
      setTopicTitle("");
      setError(null);
    }
  };

  return (
    <>
      {/* Add Topic Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="bg-white p-4 rounded-2xl md:rounded-4xl flex items-center justify-center gap-3 text-neutral-600 border border-gray-200 shadow-sm"
      >
        <FaPlus className="text-lg" />
        <span className="font-semibold">Add New Topic</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl md:rounded-4xl shadow-2xl w-full max-w-md">
            <div className="p-6 md:p-8">
              <h2 className="text-2xl font-bold mb-6 text-black">
                Add New Topic
              </h2>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label
                    htmlFor="topicTitle"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Topic Title
                  </label>
                  <input
                    id="topicTitle"
                    type="text"
                    value={topicTitle}
                    onChange={(e) => setTopicTitle(e.target.value)}
                    placeholder="e.g., Advanced Propulsion Systems"
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent transition-all"
                    disabled={isLoading}
                    autoFocus
                  />
                  {error && (
                    <p className="mt-2 text-sm text-red-600">{error}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-2xl text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !topicTitle.trim()}
                    className="flex-1 px-6 py-3 bg-black text-white rounded-2xl hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Creating...
                      </span>
                    ) : (
                      "Create Topic"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
