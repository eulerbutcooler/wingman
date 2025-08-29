"use server";

import { db } from "@/lib/db/drizzle";
import { chats, messages, type Chat, type Message, type NewChat, type NewMessage } from "@/lib/db/schema/chats";
import { eq, desc } from 'drizzle-orm';

export async function createChat(title: string, userId?: string): Promise<Chat> {
  const [chat] = await db.insert(chats).values({
    title,
    userId,
  }).returning();
  
  return chat;
}

export async function saveMessage(chatId: string, role: 'user' | 'assistant', content: string): Promise<Message> {
  const [message] = await db.insert(messages).values({
    chatId,
    role,
    content,
  }).returning();
  
  // Update chat timestamp
  await db.update(chats).set({ 
    updatedAt: new Date() 
  }).where(eq(chats.id, chatId));
  
  return message;
}

export async function getChatHistory(chatId: string): Promise<Message[]> {
  return await db.select().from(messages).where(eq(messages.chatId, chatId)).orderBy(messages.createdAt);
}

export async function getUserChats(userId?: string): Promise<Chat[]> {
  if (!userId) return [];
  return await db.select().from(chats).where(eq(chats.userId, userId)).orderBy(desc(chats.updatedAt));
}

export async function getAllChats(): Promise<Chat[]> {
  return await db.select().from(chats).orderBy(desc(chats.updatedAt)).limit(50);
}

export async function updateChatTitle(chatId: string, title: string): Promise<void> {
  await db.update(chats).set({ 
    title, 
    updatedAt: new Date() 
  }).where(eq(chats.id, chatId));
}

export async function deleteChat(chatId: string): Promise<void> {
  await db.delete(chats).where(eq(chats.id, chatId));
}

export async function getChatById(chatId: string): Promise<Chat | null> {
  const [chat] = await db.select().from(chats).where(eq(chats.id, chatId));
  return chat || null;
}
