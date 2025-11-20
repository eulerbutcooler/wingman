"use client";

import { useCallback, useRef } from "react";
import { useChatStore } from "@/stores";

/**
 * Browser Web Speech API TTS Hook
 * Fallback option when ElevenLabs is unavailable or fails
 * Uses the native browser speech synthesis API
 */
export function useBrowserTTS() {
  const { speakingIndex, setSpeakingIndex, setIsLoadingAudio } = useChatStore();
  const currentUtterance = useRef<SpeechSynthesisUtterance | null>(null);

  // Check if browser supports speech synthesis
  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  const stopSpeaking = useCallback(() => {
    if (isSupported && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      currentUtterance.current = null;
    }
    setSpeakingIndex(null);
    setIsLoadingAudio(false);
  }, [setSpeakingIndex, setIsLoadingAudio, isSupported]);

  const speakText = useCallback(
    async (text: string, messageIndex: number) => {
      if (!isSupported) {
        console.error("❌ [Browser TTS] Speech synthesis not supported in this browser");
        return;
      }

      // Stop any current speech
      stopSpeaking();

      try {
        setIsLoadingAudio(true);
        setSpeakingIndex(messageIndex);

        console.log("🔊 [Browser TTS] Starting speech synthesis for message", messageIndex);

        // Clean markdown from text
        const cleanText = text
          .replace(/\*\*(.+?)\*\*/g, "$1") // Remove bold
          .replace(/\*(.+?)\*/g, "$1") // Remove italic
          .replace(/`(.+?)`/g, "$1") // Remove code
          .replace(/\[(.+?)\]\(.+?\)/g, "$1") // Remove links, keep text
          .replace(/#{1,6}\s/g, "") // Remove headers
          .replace(/>\s/g, "") // Remove blockquotes
          .replace(/\n+/g, ". "); // Replace newlines with pauses

        const utterance = new SpeechSynthesisUtterance(cleanText);
        currentUtterance.current = utterance;

        // Configure voice settings
        utterance.rate = 1.1; // Slightly faster than normal
        utterance.pitch = 1.0; // Normal pitch
        utterance.volume = 1.0; // Full volume

        // Try to find a good voice (prefer English, female if available)
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = 
          voices.find(v => v.lang.startsWith("en") && v.name.includes("Female")) ||
          voices.find(v => v.lang.startsWith("en")) ||
          voices[0];

        if (preferredVoice) {
          utterance.voice = preferredVoice;
          console.log(`🎤 [Browser TTS] Using voice: ${preferredVoice.name}`);
        }

        // Set up event handlers
        utterance.onstart = () => {
          console.log("▶️  [Browser TTS] Speech started");
          setIsLoadingAudio(false);
        };

        utterance.onend = () => {
          console.log("✅ [Browser TTS] Speech finished");
          setSpeakingIndex(null);
          currentUtterance.current = null;
        };

        utterance.onerror = (event) => {
          console.error("❌ [Browser TTS] Speech error:", event.error);
          setSpeakingIndex(null);
          setIsLoadingAudio(false);
          currentUtterance.current = null;
        };

        // Start speaking
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error("❌ [Browser TTS] Error:", error);
        setSpeakingIndex(null);
        setIsLoadingAudio(false);
      }
    },
    [stopSpeaking, setIsLoadingAudio, setSpeakingIndex, isSupported]
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
    isSupported,
  };
}
