import { create } from "zustand";
import { Message } from "@/lib/actions/chat/actions";

interface ChatState {
  // State
  conversation: Message[];
  input: string;
  isLoading: boolean;
  chatId: string | undefined;
  mode: "normal" | "deep";
  videoMode: boolean;
  isMobileSidebarOpen: boolean;
  speakingIndex: number | null;
  isLoadingAudio: boolean;
  isVoiceInput: boolean; // Track if last user input was via voice

  // Actions
  setConversation: (conversation: Message[]) => void;
  addMessage: (message: Message) => void;
  setInput: (input: string) => void;
  setIsLoading: (isLoading: boolean) => void;
  setChatId: (chatId: string | undefined) => void;
  setMode: (mode: "normal" | "deep") => void;
  setVideoMode: (videoMode: boolean) => void;
  setIsMobileSidebarOpen: (isOpen: boolean) => void;
  setSpeakingIndex: (index: number | null) => void;
  setIsLoadingAudio: (isLoading: boolean) => void;
  setIsVoiceInput: (isVoiceInput: boolean) => void;
  resetChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  // Initial state
  conversation: [],
  input: "",
  isLoading: false,
  chatId: undefined,
  mode: "normal",
  videoMode: false,
  isMobileSidebarOpen: false,
  speakingIndex: null,
  isLoadingAudio: false,
  isVoiceInput: false,

  // Actions
  setConversation: (conversation) => set({ conversation }),

  addMessage: (message) =>
    set((state) => ({ conversation: [...state.conversation, message] })),

  setInput: (input) => set({ input }),

  setIsLoading: (isLoading) => set({ isLoading }),

  setChatId: (chatId) => set({ chatId }),

  setMode: (mode) => set({ mode }),

  setVideoMode: (videoMode) => set({ videoMode }),

  setIsMobileSidebarOpen: (isMobileSidebarOpen) => set({ isMobileSidebarOpen }),

  setSpeakingIndex: (speakingIndex) => set({ speakingIndex }),

  setIsLoadingAudio: (isLoadingAudio) => set({ isLoadingAudio }),

  setIsVoiceInput: (isVoiceInput) => set({ isVoiceInput }),

  resetChat: () =>
    set({
      conversation: [],
      input: "",
      chatId: undefined,
      speakingIndex: null,
      isLoadingAudio: false,
      isVoiceInput: false,
    }),
}));
