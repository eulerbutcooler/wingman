import { NextRequest } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: NextRequest) {
  try {
    const { text, voiceName = "Kore", temperature = 1.8, pace = "fast" } = await request.json();

    if (!text) {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const apiKey = process.env.GEMINI_TTS_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_TTS_API_KEY not configured. Please add it to your .env file." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Clean markdown from text
    const cleanText = text
      .replace(/\*\*(.+?)\*\*/g, "$1") // Remove bold
      .replace(/\*(.+?)\*/g, "$1") // Remove italic
      .replace(/`(.+?)`/g, "$1") // Remove code
      .replace(/\[(.+?)\]\(.+?\)/g, "$1") // Remove links, keep text
      .replace(/#{1,6}\s/g, "") // Remove headers
      .replace(/>\s/g, "") // Remove blockquotes
      .replace(/\n+/g, ". ") // Replace newlines with pauses
      .substring(0, 3000); // Limit chars

    const ai = new GoogleGenAI({ apiKey });

    // Natural exciting tone
    const prompt = `Say in a exciting, informative, deep middle-pitched tone at a ${pace} pace: ${cleanText}`;

    console.log("🎤 [TTS] Starting Gemini TTS stream...");
    const geminiStream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash-preview-tts",
      config: {
        temperature,
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
      contents: prompt,
    });

    // TRUE STREAMING: Stream chunks as they arrive
    let chunkCount = 0;
    let totalBytes = 0;
    let isFirstChunk = true;
    let mimeType = "audio/pcm;rate=24000";

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          const startTime = Date.now();
          
          for await (const chunk of geminiStream) {
            const part = chunk?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
            if (part?.data) {
              chunkCount++;
              const audioData = Buffer.from(part.data, "base64");
              totalBytes += audioData.length;
              
              if (isFirstChunk) {
                mimeType = part.mimeType || mimeType;
                const firstChunkTime = Date.now() - startTime;
                console.log(`🎵 [TTS] First chunk received in ${firstChunkTime}ms (${audioData.length} bytes)`);
                isFirstChunk = false;
              } else {
                console.log(`📦 [TTS] Chunk ${chunkCount}: ${audioData.length} bytes (total: ${totalBytes} bytes)`);
              }
              
              // Stream raw PCM chunks immediately
              controller.enqueue(audioData);
            }
          }
          
          const totalTime = Date.now() - startTime;
          console.log(`✅ [TTS] Stream complete: ${chunkCount} chunks, ${totalBytes} bytes in ${totalTime}ms`);
          controller.close();
        } catch (error) {
          console.error("❌ [TTS] Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "audio/pcm;rate=24000",
        "Transfer-Encoding": "chunked",
        "X-Mime-Type": mimeType,
      },
    });
  } catch (error: unknown) {
    console.error("TTS error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
