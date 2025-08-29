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
    <div className="w-80 border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <Plus size={16} />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
          Recent Chats
        </div>

        {isLoading ? (
          <div className="text-sm text-gray-500">Loading chats...</div>
        ) : chats.length === 0 ? (
          <div className="text-sm text-gray-500 italic">
            No chats yet. Start a new conversation!
          </div>
        ) : (
          <div className="space-y-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  currentChatId === chat.id
                    ? "bg-navy text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    currentChatId === chat.id ? "bg-white/20" : "bg-gray-200"
                  }`}
                >
                  <MessageSquare
                    size={12}
                    className={
                      currentChatId === chat.id ? "text-white" : "text-gray-600"
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
                        : "text-gray-500"
                    }`}
                  >
                    {new Date(chat.updatedAt).toLocaleDateString()}
                  </div>
                </div>

                <button
                  onClick={(e) => handleDeleteChat(chat.id, e)}
                  className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity ${
                    currentChatId === chat.id
                      ? "hover:bg-white/20"
                      : "hover:bg-gray-200"
                  }`}
                >
                  <Trash2
                    size={14}
                    className={
                      currentChatId === chat.id ? "text-white" : "text-gray-600"
                    }
                  />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
