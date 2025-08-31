"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import {
  Message,
  continueConversation,
  loadChatHistory,
} from "../actions/chat/actions";
import { readStreamableValue } from "@ai-sdk/rsc";
import { Send, MessageSquare, Bot, User } from "lucide-react";
import { FaArrowUp } from "react-icons/fa6";
import { useSearchParams, useRouter } from "next/navigation";
import ChatSidebar from "@/components/chat/ChatSidebar";

export const maxDuration = 30;

function ChatContent() {
  const [conversation, setConversation] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
      } = await continueConversation(newConversation, chatId);

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
      handleSubmit(e as any);
    }
  };

  const startNewChat = () => {
    setConversation([]);
    setChatId(undefined);
    setInput("");
    router.replace("/chat");
  };

  const selectChat = (id: string) => {
    router.push(`/chat?id=${id}`);
  };

  return (
    <div className="w-[100vw] h-screen bg-[#f5f5f5] overflow-hidden pb-12 pt-34">
      <div className="w-11/12 px-6 mx-auto justify-between flex h-full">
        <div className="flex h-full flex-1 gap-8  ">
          <ChatSidebar
            currentChatId={chatId}
            onSelectChat={selectChat}
            onNewChat={startNewChat}
          />

          <div className="flex-1 flex flex-col bg-white rounded-4xl shadow-sm h-full">
            {/* <div className="z-20 shadow-[0_15px_30px_15px] shadow-white/80"></div> */}

            <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
              {conversation.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto">
                  <div className="w-16 h-16 bg-navy rounded-full flex items-center justify-center mb-6">
                    <Bot size={24} className="text-white" />
                  </div>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    I'm your virtual teaching assistant for the Naval Institute
                    of Aeronautical Technology (NIAT). Ask me about aeronautical
                    engineering, naval technology, or any course-related
                    questions. I'm here to help you learn and understand complex
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
                      className={`max-w-3xl rounded-4xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-navy text-white ml-12"
                          : "bg-white border border-gray-200 text-gray-900 shadow-sm"
                      }`}
                    >
                      <div className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </div>
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

            <div className="px-6  pb-6 rounded-4xl shadow-[0_-25px_15px_-4px] shadow-white flex-shrink-0">
              <form onSubmit={handleSubmit} className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask Wingman about your studies..."
                    className="w-full px-4 py-3 border border-gray-600/40  rounded-4xl shadow-lg  focus:outline-none focus:ring-1 focus:ring-gray-600 focus:border-transparent resize-none min-h-[48px] max-h-32 "
                    rows={1}
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-5 bg-navy/80 text-white rounded-4xl hover:bg-navy cursor-pointer focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm"
                >
                  <FaArrowUp size={14} />
                  
                </button>
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
    <Suspense fallback={<div>Loading...</div>}>
      <ChatContent />
    </Suspense>
  );
}
