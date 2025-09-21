"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import {
  Message,
  continueConversation,
  loadChatHistory,
} from "../actions/chat/actions";
import { readStreamableValue } from "@ai-sdk/rsc";
import { Bot, User, Menu } from "lucide-react";
import { FaArrowUp } from "react-icons/fa6";
import { useSearchParams, useRouter } from "next/navigation";
import ChatSidebar from "@/components/chat/ChatSidebar";
import CustomMarkdown from "@/components/CustomMarkdown";
import AuthGuard from "@/components/AuthGuard";

export const maxDuration = 30;

function ChatContent() {
  const [conversation, setConversation] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<string | undefined>();
  const [mode, setMode] = useState<"normal" | "deep">("normal");
  const [videoMode, setVideoMode] = useState<boolean>(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "instant",
      block: "end",
      inline: "nearest",
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  useEffect(() => {
    const chatIdFromUrl = searchParams.get("id");
    if (chatIdFromUrl) {
      setChatId(chatIdFromUrl);
      loadChat(chatIdFromUrl);
    }
  }, [searchParams]);

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
      } = await continueConversation(newConversation, chatId, true, mode, videoMode);

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

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  const handleSelectChat = (id: string) => {
    router.push(`/chat?id=${id}`);
    if (isSidebarVisible) {
      toggleSidebar();
    }
  };

  const handleNewChat = () => {
    setChatId(undefined);
    setConversation([]);
    router.replace("/chat");
    if (isSidebarVisible) {
      toggleSidebar();
    }
  };

  return (
    <div className="w-[100vw] h-screen bg-[#f5f5f5] overflow-hidden  pb-10 pt-30">
      <div className="w-11/12 px-2 mx-auto gap-8 flex h-full">
        <ChatSidebar
          currentChatId={chatId}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          isOpen={isSidebarVisible}
          onClose={toggleSidebar}
          mode={mode}
          setMode={setMode}
          videoMode={videoMode}
          setVideoMode={setVideoMode}
          isLoading={isLoading}
        />

        <div
          className={`relative  flex flex-col bg-white rounded-4xl shadow-sm h-full ${
            isSidebarVisible ? "hidden lg:flex lg:flex-1" : "w-full lg:flex-1"
          }`}
        >
            <div className="lg:hidden absolute bg-navy rounded-full text-white shadow-lg top-4 right-4 z-20">
              <button onClick={toggleSidebar} className="p-2">
                <Menu size={24} />
              </button>
            </div>
            {/* <div className="z-20 shadow-[0_15px_30px_15px] shadow-white/80"></div> */}

            <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-6 min-h-0">
              {conversation.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto">
                  <div className="w-16 h-16 bg-navy rounded-full flex items-center justify-center mb-6">
                    <Bot size={24} className="text-white" />
                  </div>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    I&apos;m your virtual teaching assistant for the Naval Institute
                    of Aeronautical Technology (NIAT). Ask me about aeronautical
                    engineering, naval technology, or any course-related
                    questions. I&apos;m here to help you learn and understand complex
                    concepts!
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg">
                    <div className="p-4 bg-white rounded-4xl border border-gray-200 shadow-sm">
                      <h3 className="font-medium text-gray-900 mb-2">
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
                    className={`${
                      message.role === "user" ? "flex justify-end" : "flex justify-start"
                    }`}
                  >
                    <div className={`${
                      message.role === "user" 
                        ? "flex flex-col-reverse sm:flex-row sm:gap-4 items-end" 
                        : "flex flex-col sm:flex-row sm:gap-4 items-start"
                    }`}>
                      {message.role === "assistant" && (
                        <div className="w-8 h-8 bg-navy rounded-full flex items-center justify-center flex-shrink-0 mb-2 sm:mb-0 sm:mt-1">
                          <Bot size={16} className="text-white" />
                        </div>
                      )}
                      <div
                        className={`max-w-3xl rounded-4xl px-4 py-3 ${
                          message.role === "user"
                            ? "bg-navy text-white"
                            : "bg-white border border-gray-200 text-gray-900 shadow-sm"
                        }`}
                      >
                        <div className="text-sm leading-relaxed prose whitespace-pre-wrap">
                          <CustomMarkdown content={message.content} />
                        </div>
                      </div>
                      {message.role === "user" && (
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 mb-2 sm:mb-0 sm:mt-1">
                          <User size={16} className="text-gray-600" />
                        </div>
                      )}
                    </div>
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

            <div className="px-3  pb-2 rounded-4xl shadow-[0_-25px_15px_-4px] shadow-white flex-shrink-0">
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-4 w-full">
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask wingman..."
                      className="w-full px-3 py-3  border border-gray-600/40  rounded-4xl shadow-lg  focus:outline-none focus:ring-1 focus:ring-gray-600 focus:border-transparent resize-none min-h-[40px] max-h-32 scrollbar-hide"
                      rows={1}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="hidden sm:flex items-center gap-6">
                    <div className="flex flex-col lg:flex-row gap-2">
                      <button
                      type="button"
                      onClick={() => setMode(mode === "normal" ? "deep" : "normal")}
                      className={`px-2 py-2 text-xs sm:px-3 sm:py-3 sm:text-base rounded-4xl cursor-pointer transition-all duration-300  ${
                        mode === "deep"
                          ? "bg-black text-white shadow-sm  hover:shadow-xl"
                          : "bg-white shadow-sm text-neutral-800 hover:shadow-xl "
                      }`}
                      disabled={isLoading}
                    >
                      Deep Mode
                    </button>
                    <button
                      type="button"
                      onClick={() => setVideoMode(!videoMode)}
                      className={`px-2 py-2 text-xs sm:px-3 sm:py-3 sm:text-base rounded-4xl cursor-pointer transition-all duration-300  ${
                        videoMode
                          ? "bg-navy text-white shadow-sm hover:shadow-xl"
                          : "bg-white shadow-sm text-neutral-800 hover:shadow-xl "
                      }`}
                      disabled={isLoading}
                    >
                      Video
                    </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="px-4 py-4 sm:p-3.5 bg-navy text-white rounded-4xl hover:bg-navy cursor-pointer focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center shadow-sm"
                  >
                    <FaArrowUp size={18} />
                    
                  </button>
                </div>
                
                {/* Mobile buttons below input - Hidden */}
                <div className="hidden sm:hidden items-center gap-3 justify-center">
                  <button
                    type="button"
                    onClick={() => setMode(mode === "normal" ? "deep" : "normal")}
                    className={`px-4 py-3 text-sm rounded-4xl cursor-pointer transition-all duration-300  ${
                      mode === "deep"
                        ? "bg-black text-white shadow-sm  hover:shadow-xl"
                        : "bg-white shadow-sm text-neutral-800 hover:shadow-xl "
                    }`}
                    disabled={isLoading}
                  >
                    Deep Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoMode(!videoMode)}
                    className={`px-4 py-3 text-sm rounded-4xl cursor-pointer transition-all duration-300  ${
                      videoMode
                        ? "bg-navy text-white shadow-sm hover:shadow-xl"
                        : "bg-white shadow-sm text-neutral-800 hover:shadow-xl "
                    }`}
                    disabled={isLoading}
                  >
                    Video
                  </button>
                </div>
              </form>
              
            </div>
          </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><div className="loader" style={{ fontSize: '56px !important' }}></div></div>}>
        <ChatContent />
      </Suspense>
    </AuthGuard>
  );
}
