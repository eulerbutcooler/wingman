"use client";

import { useEffect, useRef, Suspense } from "react";
import {
  Message,
  continueConversation,
  loadChatHistory,
} from "../../lib/actions/chat/actions";
import { readStreamableValue } from "@ai-sdk/rsc";
import { Bot, User, History, X, Volume2, VolumeX } from "lucide-react";
import { FaArrowUp } from "react-icons/fa6";
import { useSearchParams, useRouter } from "next/navigation";
import ChatSidebar from "@/components/chat/ChatSidebar";
import CustomMarkdown from "@/components/CustomMarkdown";
import { useRequireAuth } from "@/hooks/use-auth";
import { useChatStore } from "@/stores";
import { useTextToSpeech } from "@/hooks/use-tts";
export const maxDuration = 30;

function ChatContent() {
  const {
    conversation,
    input,
    isLoading,
    chatId,
    mode,
    videoMode,
    isMobileSidebarOpen,
    speakingIndex,
    isLoadingAudio,
    setConversation,
    setInput,
    setIsLoading,
    setChatId,
    setMode,
    setVideoMode,
    setIsMobileSidebarOpen,
    resetChat,
  } = useChatStore();

  const { toggleSpeak, stopSpeaking } = useTextToSpeech();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useRequireAuth(); // Get auth status

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  useEffect(() => {
    const chatIdFromUrl = searchParams.get("id");
    if (chatIdFromUrl && chatIdFromUrl !== chatId) {
      setChatId(chatIdFromUrl);
      loadChat(chatIdFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, chatId, setChatId]);

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, [stopSpeaking]);

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const loadChat = async (id: string) => {
    try {
      setIsLoading(true);
      const history = await loadChatHistory(id);
      setConversation(history);
    } catch (error) {
      console.error("Failed to load chat history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newConversation = [...conversation, userMessage];
    setConversation(newConversation);
    setInput("");
    setIsLoading(true);

    try {
      const {
        messages,
        newMessage,
        chatId: returnedChatId,
      } = await continueConversation(
        newConversation,
        chatId,
        true,
        mode,
        videoMode
      );

      if (returnedChatId && !chatId) {
        setChatId(returnedChatId);
        router.replace(`/chat?id=${returnedChatId}`);
      }

      let textContent = "";
      for await (const delta of readStreamableValue(newMessage)) {
        textContent = `${textContent}${delta}`;
        setConversation([
          ...messages,
          { role: "assistant", content: textContent },
        ]);
      }
    } catch (error) {
      console.error("Error in conversation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as React.FormEvent);
    }
  };

  const startNewChat = () => {
    resetChat();
    router.replace("/chat");
    stopSpeaking();
  };

  const selectChat = (id: string) => {
    router.push(`/chat?id=${id}`);
    setIsMobileSidebarOpen(false);
    stopSpeaking();
  };

  return (
    <div className="w-full h-screen overflow-hidden pb-12 pt-24 md:pt-34">
      <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
      <div className="relative z-10 w-full px-2 md:px-6 md:w-11/12 mx-auto justify-between flex h-full">
        <div className="flex h-full flex-1 gap-2 md:gap-8">
          {/* Desktop: Show sidebar normally */}
          <div className="hidden md:block">
            <ChatSidebar
              currentChatId={chatId}
              onSelectChat={selectChat}
              onNewChat={startNewChat}
            />
          </div>

          {/* Mobile: Sidebar overlay */}
          {isMobileSidebarOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden">
              <div className="fixed left-0 top-0 h-full w-80 z-50 transform transition-transform">
                <div className="absolute inset-0 bg-white/50 backdrop-blur-sm"></div>
                {/* Mobile sidebar header */}
                <div className="relative z-10 flex items-center justify-between p-4 bg-white shadow-sm">
                  <h2 className="text-lg font-semibold text-black">
                    Chat History
                  </h2>
                  <button
                    onClick={() => setIsMobileSidebarOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Sidebar content */}
                <div className="relative z-10 pt-4 h-full">
                  <ChatSidebar
                    currentChatId={chatId}
                    onSelectChat={selectChat}
                    onNewChat={() => {
                      startNewChat();
                      setIsMobileSidebarOpen(false);
                    }}
                    isMobile={true}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col bg-white rounded-2xl md:rounded-4xl shadow-sm h-full">
            {/* Mobile: Add history button */}
            <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-100">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="flex items-center gap-2 px-3 py-2 bg-[#f5f5f5] rounded-lg hover:bg-gray-200 transition-colors"
              >
                <History size={18} />
                <span className="text-sm font-medium">History</span>
              </button>

              <div className="text-sm font-medium text-gray-600">
                Aeromentor Chat
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-4 md:space-y-6 min-h-0">
              {conversation.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto px-4">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-navy rounded-full flex items-center justify-center mb-4 md:mb-6">
                    <Bot size={20} className="text-white md:w-6 md:h-6" />
                  </div>
                  <p className="text-gray-600 mb-6 md:mb-8 leading-relaxed text-sm md:text-base">
                    I&apos;m AeroMentor, your virtual teaching assistant for the
                    Naval Institute of Aeronautical Technology (NIAT). Ask me
                    about aeronautical engineering, naval technology, or any
                    course-related questions. I&apos;m here to help you learn
                    and understand complex concepts!
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 w-full max-w-lg">
                    <div className="p-3 md:p-4 bg-white rounded-2xl md:rounded-4xl border border-gray-200 shadow-sm">
                      <h3 className="font-medium text-gray-900 mb-2 text-sm md:text-base">
                        Engineering Concepts
                      </h3>
                      <p className="text-sm text-gray-600">
                        Ask about aerodynamics, propulsion, structures, and more
                      </p>
                    </div>
                    <div className="p-4 bg-white rounded-4xl border border-gray-200 shadow-sm">
                      <h3 className="font-medium text-gray-900 mb-2">
                        Problem Solving
                      </h3>
                      <p className="text-sm text-gray-600">
                        Get guidance on formulas, methods, and logical steps
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                conversation.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-4 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 bg-navy rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot size={16} className="text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-3xl rounded-4xl px-4 py-3 relative ${
                        message.role === "user"
                          ? "bg-navy text-white ml-12"
                          : "bg-white border border-gray-200 text-gray-900 shadow-sm"
                      }`}
                    >
                      <div className="text-sm leading-relaxed prose whitespace-pre-wrap">
                        <CustomMarkdown content={message.content} />
                      </div>

                      {/* TTS Speaker Icon - Only for bot messages */}
                      {message.role === "assistant" && (
                        <button
                          onClick={() => toggleSpeak(message.content, index)}
                          disabled={isLoadingAudio && speakingIndex === index}
                          className={`absolute bottom-2 right-2 p-1.5 rounded-full transition-all duration-200 ${
                            speakingIndex === index
                              ? "bg-navy text-white shadow-md"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          } ${
                            isLoadingAudio && speakingIndex === index
                              ? "opacity-50 cursor-wait"
                              : ""
                          }`}
                          title={
                            speakingIndex === index
                              ? "Stop speaking"
                              : isLoadingAudio && speakingIndex === index
                              ? "Loading audio..."
                              : "Read aloud"
                          }
                        >
                          {isLoadingAudio && speakingIndex === index ? (
                            <div className="w-3.5 h-3.5 border-2 border-t-transparent border-current rounded-full animate-spin" />
                          ) : speakingIndex === index ? (
                            <VolumeX size={14} />
                          ) : (
                            <Volume2 size={14} />
                          )}
                        </button>
                      )}
                    </div>
                    {message.role === "user" && (
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <User size={16} className="text-gray-600" />
                      </div>
                    )}
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex gap-4 justify-start">
                  <div className="w-8 h-8 bg-navy rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot size={16} className="text-white" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-1">
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-3 md:px-6 pb-3 md:pb-6 rounded-2xl md:rounded-4xl shadow-[0_-25px_15px_-4px] shadow-white flex-shrink-0">
              <form
                onSubmit={handleSubmit}
                className="flex flex-col md:flex-row items-center gap-2 md:gap-4"
              >
                <div className="flex-1 relative w-full">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask Aeromentor about your studies..."
                    className="w-full px-3 md:px-4 py-3 md:py-4 border border-gray-600/40 rounded-2xl md:rounded-4xl shadow-lg focus:outline-none focus:ring-1 focus:ring-gray-600 focus:border-transparent resize-none min-h-[48px] max-h-32 text-sm md:text-base"
                    rows={1}
                    disabled={isLoading}
                  />
                </div>
                <div className="flex items-center gap-2 md:gap-6 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() =>
                      setMode(mode === "normal" ? "deep" : "normal")
                    }
                    className={`px-3 md:px-4 py-3 md:py-4 text-sm md:text-base rounded-2xl md:rounded-4xl cursor-pointer transition-all duration-300 flex-1 md:flex-none ${
                      mode === "deep"
                        ? "bg-black text-white shadow-sm hover:shadow-xl"
                        : "bg-white shadow-sm text-neutral-800 hover:shadow-xl"
                    }`}
                    disabled={isLoading}
                  >
                    Deep Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoMode(!videoMode)}
                    className={`px-3 md:px-4 py-3 md:py-4 text-sm md:text-base rounded-2xl md:rounded-4xl cursor-pointer transition-all duration-300 flex-1 md:flex-none ${
                      videoMode
                        ? "bg-navy text-white shadow-sm hover:shadow-xl"
                        : "bg-white shadow-sm text-neutral-800 hover:shadow-xl"
                    }`}
                    disabled={isLoading}
                    title={
                      videoMode
                        ? "Video mode is ON - videos will be included in responses"
                        : "Video mode is OFF - click to enable video search"
                    }
                  >
                    Video
                  </button>
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="p-3 md:p-5 bg-navy/80 text-white rounded-2xl md:rounded-4xl hover:bg-navy cursor-pointer focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <FaArrowUp size={14} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <div className="loader" style={{ fontSize: "56px !important" }}></div>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
