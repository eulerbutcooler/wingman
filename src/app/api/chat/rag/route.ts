import { NextRequest, NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { hybridSearchWithSources, getCourseIndexStats } from "@/lib/rag/search";
import { getCurrentUser } from "@/lib/auth/auth-utils";
import { classifyQuery, getQuerySpecificPrompt } from "@/lib/rag/query-classifier";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { message, courseId, maxSources = 5 } = await request.json();

    console.log("💬 RAG chat request:", { message, courseId, maxSources });

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    // Classify the query to determine optimal retrieval strategy
    console.log("🧠 Classifying query type...");
    const classification = classifyQuery(message);
    console.log(`📋 Query classified as: ${classification.type} (confidence: ${classification.confidence})`);
    console.log(`💡 Reasoning: ${classification.reasoning}`);

    // Use classification to optimize retrieval parameters
    const searchTopK = maxSources || classification.suggestedTopK;
    const searchThreshold = classification.suggestedThreshold;

    // Search for relevant chunks using hybrid search
    console.log("🔍 Searching for relevant content...");
    console.log(`⚙️  Parameters: topK=${searchTopK}, threshold=${searchThreshold}`);
    
    const relevantChunks = await hybridSearchWithSources(
      message,
      courseId,
      {
        topK: searchTopK,
        similarityThreshold: searchThreshold,
        // Adjust weights based on query type
        vectorWeight: classification.type === 'list_all' ? 0.5 : 0.7,
        keywordWeight: classification.type === 'list_all' ? 0.5 : 0.3,
      }
    );

    console.log(`📚 Found ${relevantChunks.length} relevant chunks`);

    // Prepare context from chunks with metadata
    const context = relevantChunks
      .map((chunk, index) => {
        const source = chunk.source;
        let metadata = `[Source ${index + 1}]`;
        if (source.fileName) metadata += ` (File: ${source.fileName}`;
        if (source.pageNumber) metadata += `, Page ${source.pageNumber}`;
        metadata += ')';
        return `${metadata}\n${chunk.chunkText}\n`;
      })
      .join("\n---\n\n");

    // Get query-specific prompt enhancements
    const promptEnhancements = getQuerySpecificPrompt(classification);

    // Prepare the prompt with query-specific guidance
    const systemPrompt = `You are a helpful AI assistant that answers questions based on course materials. Use the provided context to answer the user's question accurately and comprehensively.

If the context doesn't contain enough information to answer the question, say so clearly. Always cite which sources you're using by referencing [Source X] in your response.

${promptEnhancements.systemAddition}

Context from course materials:
${context}

If no context is provided or the context is not relevant, explain that you need more specific course materials to answer the question.`;

    const userPrompt = `Question: ${message}${promptEnhancements.userAddition}

Please provide a detailed answer based on the course materials provided in the context. If you reference specific information, please cite the source number.`;

    // Generate response using Gemini
    console.log("🤖 Generating AI response...");
    const { text: aiResponse } = await generateText({
      model: google("gemini-3.1-flash-lite"),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: classification.suggestedTemperature,
    });

    console.log("✅ Generated AI response");

    // Prepare sources information with enhanced metadata
    const sources = relevantChunks.map((chunk, index) => ({
      id: chunk.chunkId,
      index: index + 1,
      similarity: Math.round(chunk.similarity * 100) / 100,
      keywordScore: chunk.keywordScore ? Math.round(chunk.keywordScore * 100) / 100 : 0,
      hybridScore: chunk.hybridScore ? Math.round(chunk.hybridScore * 100) / 100 : 0,
      preview:
        chunk.chunkText.substring(0, 200) +
        (chunk.chunkText.length > 200 ? "..." : ""),
      chunkIndex: chunk.chunkIndex,
      fileId: chunk.source.fileId,
      fileName: chunk.source.fileName,
      pageNumber: chunk.source.pageNumber,
    }));

    // Get course stats for additional context
    const courseStats = await getCourseIndexStats(courseId);

    return NextResponse.json({
      success: true,
      response: aiResponse,
      sources,
      metadata: {
        query: message,
        courseId,
        queryClassification: {
          type: classification.type,
          confidence: classification.confidence,
          reasoning: classification.reasoning,
        },
        searchParams: {
          topK: searchTopK,
          threshold: searchThreshold,
        },
        sourcesFound: relevantChunks.length,
        hasRelevantContext: relevantChunks.length > 0,
        courseStats: {
          indexedFiles: parseInt(courseStats.indexed_files as string) || 0,
          totalChunks: parseInt(courseStats.total_chunks as string) || 0,
          avgChunkTokens: Math.round(
            parseFloat(courseStats.avg_chunk_tokens as string) || 0
          ),
        },
      },
    });
  } catch (error) {
    console.error("💥 Error in RAG chat:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET /api/chat/rag - Get course index information
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      );
    }

    const stats = await getCourseIndexStats(courseId);

    return NextResponse.json({
      success: true,
      courseId,
      stats: {
        indexedFiles: parseInt(stats.indexed_files as string) || 0,
        totalChunks: parseInt(stats.total_chunks as string) || 0,
        avgChunkTokens: Math.round(
          parseFloat(stats.avg_chunk_tokens as string) || 0
        ),
        firstIndexed: stats.first_indexed,
        lastIndexed: stats.last_indexed,
      },
      isReady: parseInt(stats.total_chunks as string) > 0,
    });
  } catch (error) {
    console.error("Error getting course index info:", error);

    return NextResponse.json(
      {
        error: "Failed to get course index information",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
