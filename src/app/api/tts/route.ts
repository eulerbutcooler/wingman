import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey || apiKey === "your_elevenlabs_api_key_here") {
      return NextResponse.json(
        {
          error:
            "ElevenLabs API key not configured. Please add ELEVENLABS_API_KEY to your .env file.",
        },
        { status: 500 }
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
      .substring(0, 5000); // Limit to 5000 chars to control cost

    // Use ElevenLabs TTS API
    // Using custom voice ID
    const voiceId = "9PvnT6XRzlljoaDG6Knu"; // Custom Indian voice

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: "eleven_multilingual_v2", // Better for Indian accent
          voice_settings: {
            stability: 0.6, // Higher stability for warm, consistent tone
            similarity_boost: 0.8, // Higher similarity for authentic voice
            style: 0.3, // Slight style for friendliness
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("ElevenLabs API error:", error);
      return NextResponse.json(
        { error: "Failed to generate speech. Check your API key and quota." },
        { status: response.status }
      );
    }

    // Get audio as array buffer
    const audioBuffer = await response.arrayBuffer();

    // Convert to base64
    const base64Audio = Buffer.from(audioBuffer).toString("base64");

    // Return the base64 encoded audio
    return NextResponse.json({
      audioContent: base64Audio,
    });
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
