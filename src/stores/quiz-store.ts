import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Quiz, Course, QuizResult } from "@/types";

type ViewType =
  | "courses"
  | "course_quizzes"
  | "quiz_in_progress"
  | "quiz_results"
  | "review_answers";

interface QuizResults {
  score: number;
  answers: Record<string, string>;
  timeSpent: number;
}

interface QuizState {
  // State
  view: ViewType;
  courses: Course[];
  selectedCourse: Course | null;
  courseQuizzes: Quiz[];
  activeQuiz: Quiz | null;
  quizResults: QuizResults | null;
  loading: boolean;
  error: string | null;
  resettingQuizId: string | null;
  lastFetchTime: number | null;

  // Actions
  setView: (view: ViewType) => void;
  setCourses: (courses: Course[]) => void;
  setSelectedCourse: (course: Course | null) => void;
  setCourseQuizzes: (quizzes: Quiz[]) => void;
  setActiveQuiz: (quiz: Quiz | null) => void;
  setQuizResults: (results: QuizResults | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setResettingQuizId: (id: string | null) => void;
  updateQuizResult: (quizId: string, result: QuizResult) => void;
  reset: () => void;
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set) => ({
      // Initial state
      view: "courses",
      courses: [],
      selectedCourse: null,
      courseQuizzes: [],
      activeQuiz: null,
      quizResults: null,
      loading: false,
      error: null,
      resettingQuizId: null,
      lastFetchTime: null,

      // Actions
      setView: (view) => set({ view }),

      setCourses: (courses) => set({ courses, lastFetchTime: Date.now() }),

      setSelectedCourse: (selectedCourse) => set({ selectedCourse }),

      setCourseQuizzes: (courseQuizzes) => set({ courseQuizzes }),

      setActiveQuiz: (activeQuiz) => set({ activeQuiz }),

      setQuizResults: (quizResults) => set({ quizResults }),

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),

      setResettingQuizId: (resettingQuizId) => set({ resettingQuizId }),

      updateQuizResult: (quizId, result) =>
        set((state) => ({
          courseQuizzes: state.courseQuizzes.map((quiz) =>
            quiz.id === quizId ? { ...quiz, latestResult: result } : quiz
          ),
        })),

      reset: () =>
        set({
          view: "courses",
          selectedCourse: null,
          activeQuiz: null,
          quizResults: null,
          resettingQuizId: null,
        }),
    }),
    {
      name: "quiz-storage",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        courses: state.courses,
        lastFetchTime: state.lastFetchTime,
        // Don't persist view, selectedCourse, activeQuiz, courseQuizzes
        // This ensures user goes back to main page if they navigate away
      }),
      skipHydration: false,
    }
  )
);
