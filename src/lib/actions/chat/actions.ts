"use server";

import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { createStreamableValue } from "@ai-sdk/rsc";
import {
  saveMessage,
  getChatHistory,
  createChat,
} from "@/lib/actions/chat/chat-actions";
import {
  searchAllCoursesHybrid,
  formatContextForWingman,
  getCourseSummary,
} from "@/lib/rag/user-search";
import { classifyQuery, getQuerySpecificPrompt } from "@/lib/rag/query-classifier";

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
  mode: "normal" | "deep" = "normal",
  videoMode: boolean = false
) {
  "use server";

  const stream = createStreamableValue();
  let currentChatId = chatId;

  if (!currentChatId && shouldSave) {
    const firstUserMessage = history.find((msg) => msg.role === "user");
    const title = firstUserMessage?.content
      ? firstUserMessage.content.slice(0, 50) +
        (firstUserMessage.content.length > 50 ? "..." : "")
      : "New Chat";
    const newChat = await createChat(title);
    currentChatId = newChat.id;
  }

  if (currentChatId && shouldSave) {
    const lastUserMessage = history[history.length - 1];
    if (lastUserMessage.role === "user") {
      await saveMessage(currentChatId, "user", lastUserMessage.content);
    }
  }

  (async () => {
    const lastUserMessage = history[history.length - 1];
    const userQuery =
      lastUserMessage?.role === "user" ? lastUserMessage.content : "";

    let systemPrompt = `
You are "AeroMentor" (NOT Wingman), a virtual teaching assistant and study buddy for students at the Naval Institute of Aeronautical Technology (NIAT). Your purpose is to provide clear, in-depth explanations, guide students through complex concepts, and foster a better understanding of their curriculum.

IMPORTANT: Always refer to yourself as "AeroMentor" when introducing yourself or stating your name. Never use any other name.

Persona and Tone

    Mannerisms: You are a friendly, patient, and knowledgeable tutor. Your tone is supportive and encouraging, always aiming to build the student's confidence.

    Language: Use clear, straightforward English. Break down complex jargon and use analogies when appropriate to make concepts easier to grasp.

    Teaching Style: Do not simply give the answer. Instead, guide the student with hints, clarifying questions, and step-by-step explanations.

    Proactive Help: If a student asks a basic question, provide the answer but also offer to elaborate on related sub-topics. For example, after explaining a concept, you can ask, "Would you like me to provide an example or explain the underlying principles in more detail?"

    Closing: End each interaction with an encouraging remark, like, "I hope that was helpful. What would you like to explore next?" or "Keep up the great work! Let me know if you have any more questions."

Knowledge Base

    Fundamental Concepts: You have a deep understanding of core aeronautical engineering and naval technology principles, including aerodynamics, propulsion, aircraft structures, and avionics.

    NIAT Context: You are familiar with the academic programs and common course topics at NIAT. You can provide explanations tailored to the institute's curriculum.

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

    // Add RAG context for Deep Mode with IMPROVED hybrid search and query classification
    let classification;
    if (mode === "deep" && userQuery) {
      try {
        console.log("🔍 Deep Mode: Searching ALL course materials globally...");
        
        // Step 1: Classify the query to optimize retrieval
        classification = classifyQuery(userQuery);
        console.log(`📋 Query classified as: ${classification.type} (confidence: ${classification.confidence})`);
        console.log(`💡 Reasoning: ${classification.reasoning}`);

        // Step 2: Use adaptive parameters based on query type
        const searchParams = {
          maxResults: classification.suggestedTopK,
          similarityThreshold: classification.suggestedThreshold,
          // Adjust weights for "list all" queries
          vectorWeight: classification.type === 'list_all' ? 0.5 : 0.7,
          keywordWeight: classification.type === 'list_all' ? 0.5 : 0.3,
        };

        console.log(`⚙️  Search params: topK=${searchParams.maxResults}, threshold=${searchParams.similarityThreshold}`);

        // Step 3: Use hybrid search for better results
        const relevantChunks = await searchAllCoursesHybrid(
          userQuery,
          searchParams
        );

        if (relevantChunks.length > 0) {
          const context = formatContextForWingman(relevantChunks);
          const courseSummary = getCourseSummary(relevantChunks);
          
          // Step 4: Get query-specific prompt guidance
          const promptEnhancements = getQuerySpecificPrompt(classification);
          
          systemPrompt += `

ADDITIONAL CONTEXT FROM COURSE MATERIALS:

📚 COURSES IN RESULTS:
${courseSummary}

---

SOURCES:
${context}

IMPORTANT CITATION REQUIREMENTS FOR DEEP MODE:
- When using information from the provided context, you MUST cite your sources using the format: [Source X: filename from Course: "CourseName", Page Y] (if page number is available) or [Source X: filename from Course: "CourseName"] (if no page number)
- For direct quotes, use: "quoted text" [Source X]
- For paraphrased information, use: [Source X]
- Always reference the specific source number that corresponds to the context you're using
- Maintain your teaching style while incorporating these citations naturally into your explanations
- IMPORTANT: If the student asks about a specific course by name, ONLY use sources from that course. The course name is clearly marked in each source citation.

${promptEnhancements.systemAddition}

When relevant to the student's question, reference the course materials above using proper citations while maintaining your supportive teaching approach. Blend your general knowledge with the specific course content provided. If the student specifies a course name, filter your response to ONLY include information from that specific course.`;
          console.log(
            `✅ Added ${relevantChunks.length} relevant sources to context`
          );
          console.log(`📚 Courses in results: ${courseSummary}`);
        } else {
          console.log("📝 No relevant course materials found above threshold");
        }
      } catch (error) {
        console.error("🚨 RAG search failed:", error);
      }
    }

    const { textStream } = streamText({
      model: google("gemini-2.5-flash-lite"),
      system: systemPrompt,
      messages: history,
      temperature: classification?.suggestedTemperature ?? 0.7,
    });

    let fullContent = "";
    for await (const text of textStream) {
      fullContent += text;
      stream.update(text);
    }

    if (currentChatId && shouldSave && fullContent) {
      await saveMessage(currentChatId, "assistant", fullContent);
    }

    if (videoMode && userQuery) {
      try {
        console.log(
          "🎥 Video mode enabled - generating YouTube search keywords..."
        );

        const keywordResponse = streamText({
          model: google("gemini-2.5-flash-lite"),
          system:
            "You are Aeromentors's video search assistant for NIAT students. Generate 2-3 educational YouTube search keywords focused on aeronautical engineering, naval technology, aviation, or related STEM topics that would help NIAT students understand the concept better. Prioritize content from educational channels, universities, or professional engineering sources. Ignore entertainment or non-academic content. Return only the keywords separated by spaces.",
          messages: [{ role: "user", content: userQuery }],
        });

        let keywords = "";
        for await (const text of keywordResponse.textStream) {
          keywords += text;
        }

        keywords = keywords.trim();
        console.log("🔍 Generated keywords:", keywords);

        if (keywords) {
          const youtubeResponse = await fetch(
            `${
              process.env.NEXT_PUBLIC_URL || "http://localhost:3000"
            }/api/youtube?q=${encodeURIComponent(keywords)}`
          );

          if (youtubeResponse.ok) {
            const videoData = await youtubeResponse.json();

            if (videoData.success && videoData.videos?.length > 0) {
              console.log(`✅ Found ${videoData.videos.length} videos`);

              const videoMessage = `\n\n---\n\n🎥 **Related Educational Videos:**\n\n${videoData.videos
                .map(
                  (
                    video: {
                      id: string;
                      title: string;
                      channelTitle: string;
                      url: string;
                    },
                    index: number
                  ) =>
                    `**${index + 1}. ${video.title}**\n` +
                    `Channel: ${video.channelTitle}\n` +
                    `[YOUTUBE_EMBED:${video.id}]\n` +
                    `[Watch on YouTube](${video.url})\n`
                )
                .join("\n")}`;

              stream.update(videoMessage);

              if (currentChatId && shouldSave) {
                await saveMessage(
                  currentChatId,
                  "assistant",
                  fullContent + videoMessage
                );
              }
            }
          }
        }
      } catch (error) {
        console.error("❌ Video search failed:", error);
      }
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
