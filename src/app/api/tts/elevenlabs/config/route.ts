import { NextResponse } from "next/server";

/**
 * GET /api/tts/elevenlabs/config
 * Returns ElevenLabs configuration for client-side WebSocket connection
 */
export async function GET() {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "ELEVENLABS_API_KEY not configured. Please add it to your .env file." },
        { status: 500 }
      );
    }

    // Return config for client with hardcoded voice ID
    return NextResponse.json({
      apiKey,
      voiceId: "2zRM7PkgwBPiau2jvVXc", // Hardcoded voice ID
      model: "eleven_flash_v2_5", // Fastest model for real-time
      outputFormat: "pcm_24000", // Best quality/performance balance
    });
  } catch (error) {
    console.error("Error fetching ElevenLabs config:", error);
    return NextResponse.json(
      { error: "Failed to fetch ElevenLabs configuration" },
      { status: 500 }
    );
  }
}
