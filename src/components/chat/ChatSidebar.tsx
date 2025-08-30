"use client";

import { useState, useEffect } from "react";
import { Plus, MessageSquare, Trash2, Edit3 } from "lucide-react";
import { getAllChats, deleteChat } from "@/lib/db/actions/chat-actions";
import { Chat } from "@/lib/db/schema/chats";

interface ChatSidebarProps {
  currentChatId?: string;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
}

export default function ChatSidebar({
  currentChatId,
  onSelectChat,
  onNewChat,
}: ChatSidebarProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const chatList = await getAllChats();
      setChats(chatList);
    } catch (error) {
      console.error("Failed to load chats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this chat?")) {
      try {
        await deleteChat(chatId);
        setChats(chats.filter((chat) => chat.id !== chatId));
        if (currentChatId === chatId) {
          onNewChat();
        }
      } catch (error) {
        console.error("Failed to delete chat:", error);
      }
    }
  };

  return (
    <div className="flex flex-col ">
      <div className="bg-[#f5f5f5]">
        <button
          onClick={onNewChat}
          className="flex items-center gap-2 w-80 cursor-pointer px-5 py-3 fixed  font-medium text-black bg-white shadow-sm hover:shadow-xl  rounded-4xl transition-colors"
        >
          <Plus size={20} />
          New Chat
        </button>
      </div>
    <div className="w-80 bg-[#f5f5f5] pt-18 rounded-4xl flex flex-col h-full">
      

      <div className="flex-1 bg-white shadow-sm rounded-4xl overflow-y-auto px-6 p-4">
        <div className=" font-medium text-gray-600 tracking-wide mb-4">
          Recent Chats
        </div>

        {isLoading ? (
          <div className="text-sm text-gray-600">Loading chats...</div>
        ) : chats.length === 0 ? (
          <div className="text-sm text-gray-600 italic">
            No chats yet. Start a new conversation!
          </div>
        ) : (
          <div className="space-y-6">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`group flex items-center gap-3 transition-all duration-300 shadow-sm  text-white p-2 px-4 rounded-4xl cursor-pointer ${
                  currentChatId === chat.id
                    ? "bg-navy hover:shadow-xl text-white"
                    : "  hover:shadow-xl  "
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full text-white flex items-center justify-center flex-shrink-0 ${
                    currentChatId === chat.id ? "" : ""
                  }`}
                >
                  <MessageSquare
                    size={14}
                    className={
                      currentChatId === chat.id ? "text-white" : "text-gray-900"
                    }
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div
                    className={`text-sm font-medium truncate ${
                      currentChatId === chat.id ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {chat.title}
                  </div>
                  <div
                    className={`text-xs truncate ${
                      currentChatId === chat.id
                        ? "text-white/70"
                        : "text-gray-900/70"
                    }`}
                  >
                    {new Date(chat.updatedAt).toLocaleDateString()}
                  </div>
                </div>

                <button
                  onClick={(e) => handleDeleteChat(chat.id, e)}
                  className={`opacity-0 group-hover:opacity-100 p-1 cursor-pointer rounded transition-opacity ${
                    currentChatId === chat.id
                      ? "hover:text-white"
                      : "hover:text-gray-900"
                  }`}
                >
                  <Trash2
                    size={18}
                    className={
                      currentChatId === chat.id ? "text-white/70" : "text-gray-900/70"
                    }
                  />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
