"use client";

import { useRef, useCallback } from "react";
import { useChatStore } from "@/stores";

// Helper to create WAV header for PCM data
function createWavHeader(dataLength: number, sampleRate = 24000, numChannels = 1, bitsPerSample = 16) {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);
  
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };
  
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, "data");
  view.setUint32(40, dataLength, true);
  
  return new Uint8Array(buffer);
}

export function useTextToSpeech() {
  const { speakingIndex, setSpeakingIndex, setIsLoadingAudio } = useChatStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setSpeakingIndex(null);
    setIsLoadingAudio(false);
  }, [setSpeakingIndex, setIsLoadingAudio]);

  const speakText = useCallback(
    async (text: string, messageIndex: number) => {
      stopSpeaking();

      try {
        setIsLoadingAudio(true);
        setSpeakingIndex(messageIndex);

        console.log("🔊 [Client] Requesting TTS for message", messageIndex);
        const fetchStart = Date.now();

        const response = await fetch("/api/tts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            text,
            voiceName: "Kore",     // Commanding, low-pitched voice
            temperature: 1.2,      // Balanced energy
            pace: "natural"        // Natural speaking pace
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Failed to generate speech" }));
          throw new Error(errorData.error || "Failed to generate speech");
        }

        console.log(`⏱️  [Client] Response received in ${Date.now() - fetchStart}ms`);

        // STREAMING PLAYBACK: Collect PCM chunks as they arrive
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const chunks: Uint8Array[] = [];
        let totalLength = 0;
        let chunkCount = 0;
        const streamStart = Date.now();

        console.log("📥 [Client] Starting to read stream...");

        // Read all chunks from the stream
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log(`✅ [Client] Stream complete: ${chunkCount} chunks, ${totalLength} bytes in ${Date.now() - streamStart}ms`);
            break;
          }
          
          chunkCount++;
          chunks.push(value);
          totalLength += value.length;
          
          if (chunkCount === 1) {
            console.log(`🎵 [Client] First chunk received: ${value.length} bytes in ${Date.now() - streamStart}ms`);
          } else {
            console.log(`📦 [Client] Chunk ${chunkCount}: ${value.length} bytes (total: ${totalLength} bytes)`);
          }
        }

        // Combine all PCM chunks
        const pcmData = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
          pcmData.set(chunk, offset);
          offset += chunk.length;
        }

        console.log("🔨 [Client] Building WAV file...");

        // Add WAV header and create blob
        const wavHeader = createWavHeader(pcmData.length);
        const wavBlob = new Blob([wavHeader, pcmData], { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(wavBlob);

        console.log("▶️  [Client] Starting audio playback...");

        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          console.log("✅ [Client] Audio playback finished");
          setSpeakingIndex(null);
          audioRef.current = null;
          setIsLoadingAudio(false);
          URL.revokeObjectURL(audioUrl);
        };

        audio.onerror = () => {
          console.error("❌ [Client] Audio playback error");
          setSpeakingIndex(null);
          audioRef.current = null;
          setIsLoadingAudio(false);
          URL.revokeObjectURL(audioUrl);
        };

        // Start playback as soon as we have the data
        await audio.play();
        console.log(`🎶 [Client] Total time to play: ${Date.now() - fetchStart}ms`);
        setIsLoadingAudio(false);
      } catch (error) {
        console.error("❌ [Client] TTS error:", error);
        setSpeakingIndex(null);
        setIsLoadingAudio(false);
      }
    },
    [stopSpeaking, setIsLoadingAudio, setSpeakingIndex]
  );

  const toggleSpeak = useCallback(
    (text: string, messageIndex: number) => {
      if (speakingIndex === messageIndex) {
        stopSpeaking();
      } else {
        speakText(text, messageIndex);
      }
    },
    [speakingIndex, stopSpeaking, speakText]
  );

  return {
    speakText,
    stopSpeaking,
    toggleSpeak,
  };
}
