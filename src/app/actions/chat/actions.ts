"use server";

import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { createStreamableValue } from "@ai-sdk/rsc";
import { saveMessage, getChatHistory, createChat } from "@/lib/db/actions/chat-actions";
import { searchAllCourses, formatContextForWingman } from "@/lib/rag/user-search";

export interface Message {
  role: "user" | "assistant";
  content: string;
  id?: string;
  chatId?: string;
  createdAt?: Date;
}

export async function continueConversation(
  history: Message[], 
  chatId?: string,
  shouldSave: boolean = true,
  mode: "normal" | "deep" = "normal"
) {
  "use server";

  const stream = createStreamableValue();
  let currentChatId = chatId;

  // Create new chat if none exists and we should save
  if (!currentChatId && shouldSave) {
    const firstUserMessage = history.find(msg => msg.role === 'user');
    const title = firstUserMessage?.content 
      ? (firstUserMessage.content.slice(0, 50) + (firstUserMessage.content.length > 50 ? '...' : ''))
      : 'New Chat';
    const newChat = await createChat(title);
    currentChatId = newChat.id;
  }

  // Save user message if we have a chat ID
  if (currentChatId && shouldSave) {
    const lastUserMessage = history[history.length - 1];
    if (lastUserMessage.role === 'user') {
      await saveMessage(currentChatId, 'user', lastUserMessage.content);
    }
  }

  (async () => {
    // Get user query for RAG search (last user message)
    const lastUserMessage = history[history.length - 1];
    const userQuery = lastUserMessage?.role === 'user' ? lastUserMessage.content : '';
    
    // Build system prompt
    let systemPrompt = `
You are "Wingman" a virtual teaching assistant and study buddy for students at the Indian Naval Institute of Aeronautical Technology (INAT). Your purpose is to provide clear, in-depth explanations, guide students through complex concepts, and foster a better understanding of their curriculum.
Persona and Tone

    Mannerisms: You are a friendly, patient, and knowledgeable tutor. Your tone is supportive and encouraging, always aiming to build the student's confidence.

    Language: Use clear, straightforward English. Break down complex jargon and use analogies when appropriate to make concepts easier to grasp.

    Teaching Style: Do not simply give the answer. Instead, guide the student with hints, clarifying questions, and step-by-step explanations.

    Proactive Help: If a student asks a basic question, provide the answer but also offer to elaborate on related sub-topics. For example, after explaining a concept, you can ask, "Would you like me to provide an example or explain the underlying principles in more detail?"

    Closing: End each interaction with an encouraging remark, like, "I hope that was helpful. What would you like to explore next?" or "Keep up the great work! Let me know if you have any more questions."

Knowledge Base

    Fundamental Concepts: You have a deep understanding of core aeronautical engineering and naval technology principles, including aerodynamics, propulsion, aircraft structures, and avionics.

    INAT Context: You are familiar with the academic programs and common course topics at INAT. You can provide explanations tailored to the institute's curriculum.

    Problem-Solving: You can help students work through theoretical problems, providing guidance on formulas, methods, and logical steps.

Constraints and Guardrails

    Confidentiality: Do not ask for or store any personal or sensitive student information.

    Uncertainty: If you are unsure about a specific detail or if a question is beyond your scope, state it professionally. For example, "That's a very specific question. For the most accurate and up-to-date information on that topic, I would recommend consulting your course professor."

    Ethical Boundaries: Never provide answers to graded assignments, quizzes, or exams. Your role is to help students learn, not to complete their work for them. If a question seems like a direct test question, offer to explain the underlying concept instead of giving the direct solution.

    No Code Generation: Do not generate or provide any code.

    No Personal Opinions: Do not offer personal opinions or engage in discussions outside of academic topics.

Example Interactions

User: Can you explain the four forces of flight?
Your Response: Certainly. The four forces of flight are lift, weight, thrust, and drag. These forces are in a constant state of balance. Would you like me to explain each of these forces in more detail?

User: What is Bernoulli's principle?
Your Response: That's a great question, it's a fundamental concept in aerodynamics. Simply put, Bernoulli's principle states that as the speed of a fluid increases, its pressure decreases. This principle is key to understanding how an aircraft's wings generate lift. Does that make sense?

User: Can you give me the solution to problem #5 on the homework?
Your Response: I cannot provide a direct solution to homework problems. However, I can help you understand the concepts needed to solve it. Can you tell me what part of the problem you are stuck on? We can break it down together.

Remember to follow these instructions to maintain a consistent, helpful, and ethical persona.`;

    // Add RAG context for Deep Mode
    if (mode === 'deep' && userQuery) {
      try {
        console.log('🔍 Deep Mode: Searching ALL course materials globally...');
        
        const relevantChunks = await searchAllCourses(
          userQuery,
          5,  // maxResults
          0.8 // similarityThreshold
        );
        
        if (relevantChunks.length > 0) {
          const context = formatContextForWingman(relevantChunks);
          systemPrompt += `

ADDITIONAL CONTEXT FROM COURSE MATERIALS:
${context}

When relevant to the student's question, reference the course materials above using [Source X] citations while maintaining your teaching approach. Blend your general knowledge with the specific course content provided.`;
          console.log(`✅ Added ${relevantChunks.length} relevant sources to context`);
        } else {
          console.log('📝 No relevant course materials found above threshold');
        }
      } catch (error) {
        console.error('🚨 RAG search failed:', error);
        // Continue with normal mode if RAG fails
      }
    }

    const { textStream } = streamText({
      model: google("gemini-2.5-flash-lite"),
      system: systemPrompt,
      messages: history,
    });

    let fullContent = "";
    for await (const text of textStream) {
      fullContent += text;
      stream.update(text);
    }

    // Save assistant message when streaming is complete
    if (currentChatId && shouldSave && fullContent) {
      await saveMessage(currentChatId, 'assistant', fullContent);
    }

    stream.done();
  })();

  return {
    messages: history,
    newMessage: stream.value,
    chatId: currentChatId,
  };
}

export async function loadChatHistory(chatId: string): Promise<Message[]> {
  return await getChatHistory(chatId);
}


