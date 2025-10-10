"use client";

import { useRef, useCallback } from "react";
import { useChatStore } from "@/stores";

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

        const response = await fetch("/api/tts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate speech");
        }

        const data = await response.json();

        const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
        audioRef.current = audio;

        audio.onended = () => {
          setSpeakingIndex(null);
          audioRef.current = null;
          setIsLoadingAudio(false);
        };

        audio.onerror = () => {
          setSpeakingIndex(null);
          audioRef.current = null;
          setIsLoadingAudio(false);
          console.error("Audio playback error");
        };

        await audio.play();
        setIsLoadingAudio(false);
      } catch (error) {
        console.error("TTS error:", error);
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
