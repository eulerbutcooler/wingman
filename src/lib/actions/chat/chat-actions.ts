"use server";

import { getCurrentUser } from "@/lib/auth/auth-utils";
import { db } from "@/services/db/drizzle";
import {
  chats,
  messages,
  type Chat,
  type Message,
} from "@/services/db/schema/chats";
import { eq, desc } from "drizzle-orm";

export async function createChat(
  title: string,
  userId?: number
): Promise<Chat> {
  // Get user for this specific request
  const user = await getCurrentUser();
  if (!user?.id) {
    throw new Error("Unauthorized");
  }

  const [chat] = await db
    .insert(chats)
    .values({
      title,
      userId: userId || user.id, // Use provided userId or user ID
    })
    .returning();

  return chat;
}

export async function saveMessage(
  chatId: string,
  role: "user" | "assistant",
  content: string
): Promise<Message> {
  // Get session for this specific request
  const user = await getCurrentUser();
  if (!user?.id) {
    throw new Error("Unauthorized");
  }

  const [message] = await db
    .insert(messages)
    .values({
      chatId,
      role,
      content,
    })
    .returning();

  // Update chat timestamp
  await db
    .update(chats)
    .set({
      updatedAt: new Date(),
    })
    .where(eq(chats.id, chatId));

  return message;
}

export async function getChatHistory(chatId: string): Promise<Message[]> {
  const user = await getCurrentUser();
  if (!user?.id) {
    throw new Error("Unauthorized");
  }

  return await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(messages.createdAt);
}

export async function getUserChats(userId?: number): Promise<Chat[]> {
  const user = await getCurrentUser();
  if (!user?.id) {
    throw new Error("Unauthorized");
  }

  const targetUserId = userId || user.id;

  return await db
    .select()
    .from(chats)
    .where(eq(chats.userId, targetUserId))
    .orderBy(desc(chats.updatedAt));
}

export async function updateChatTitle(
  chatId: string,
  title: string
): Promise<void> {
  const user = await getCurrentUser();
  if (!user?.id) {
    throw new Error("Unauthorized");
  }

  await db
    .update(chats)
    .set({
      title,
      updatedAt: new Date(),
    })
    .where(eq(chats.id, chatId));
}

export async function deleteChat(chatId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user?.id) {
    throw new Error("Unauthorized");
  }

  await db.delete(chats).where(eq(chats.id, chatId));
}

export async function getChatById(chatId: string): Promise<Chat | null> {
  const user = await getCurrentUser();
  if (!user?.id) {
    throw new Error("Unauthorized");
  }

  const [chat] = await db.select().from(chats).where(eq(chats.id, chatId));
  return chat || null;
}
