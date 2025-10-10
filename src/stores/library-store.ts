import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Course, Topic, ViewType } from "@/types/library";

interface LibraryState {
  // State
  view: ViewType;
  selectedCourse: Course | null;
  selectedTopic: Topic | null;
  courses: Course[];
  loading: boolean;
  error: string | null;
  courseSummary: string;
  lastFetchTime: number | null;

  // Actions
  setView: (view: ViewType) => void;
  setSelectedCourse: (course: Course | null) => void;
  setSelectedTopic: (topic: Topic | null) => void;
  setCourses: (courses: Course[]) => void;
  addCourse: (course: Course) => void;
  removeCourse: (courseId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCourseSummary: (summary: string) => void;
  reset: () => void;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set) => ({
      // Initial state
      view: "library",
      selectedCourse: null,
      selectedTopic: null,
      courses: [],
      loading: false,
      error: null,
      courseSummary: "",
      lastFetchTime: null,

      // Actions
      setView: (view) => set({ view }),

      setSelectedCourse: (selectedCourse) => set({ selectedCourse }),

      setSelectedTopic: (selectedTopic) => set({ selectedTopic }),

      setCourses: (courses) => set({ courses, lastFetchTime: Date.now() }),

      addCourse: (course) =>
        set((state) => ({
          courses: [course, ...state.courses],
          lastFetchTime: Date.now(),
        })),

      removeCourse: (courseId) =>
        set((state) => ({
          courses: state.courses.filter((c) => c.id !== courseId),
          lastFetchTime: Date.now(),
        })),

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),

      setCourseSummary: (courseSummary) => set({ courseSummary }),

      reset: () =>
        set({
          view: "library",
          selectedCourse: null,
          selectedTopic: null,
          courseSummary: "",
        }),
    }),
    {
      name: "library-storage",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        view: state.view,
        selectedCourse: state.selectedCourse,
        selectedTopic: state.selectedTopic,
        courses: state.courses,
        courseSummary: state.courseSummary,
        lastFetchTime: state.lastFetchTime,
      }),
      skipHydration: false,
      onRehydrateStorage: () => (state) => {
        // Filter out invalid courses with numeric or invalid UUIDs
        if (state?.courses) {
          state.courses = state.courses.filter(
            (course) =>
              typeof course.id === "string" &&
              course.id.length > 10 && // UUIDs are at least 36 chars
              course.id.includes("-") // UUIDs have hyphens
          );
        }
      },
    }
  )
);
