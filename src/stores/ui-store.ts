import { create } from "zustand";

interface UIState {
  // Mobile sidebar states
  isMobileMenuOpen: boolean;

  // Modal states
  showDeleteModal: boolean;

  // Actions
  setIsMobileMenuOpen: (isOpen: boolean) => void;
  toggleMobileMenu: () => void;
  setShowDeleteModal: (show: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  isMobileMenuOpen: false,
  showDeleteModal: false,

  // Actions
  setIsMobileMenuOpen: (isMobileMenuOpen) => set({ isMobileMenuOpen }),

  toggleMobileMenu: () =>
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),

  setShowDeleteModal: (showDeleteModal) => set({ showDeleteModal }),
}));
