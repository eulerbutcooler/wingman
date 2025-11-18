"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UseSpeechRecognitionReturn {
  transcript: string;
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  hasFinishedSpeaking: boolean;
}

// Type definitions for Speech Recognition API
interface SpeechRecognitionType {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEventType) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
}

interface SpeechRecognitionEventType {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFinishedSpeaking, setHasFinishedSpeaking] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Play notification sound
  const playSound = useCallback((frequency: number, duration: number) => {
    if (typeof window !== "undefined" && window.AudioContext) {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + duration
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    }
  }, []);

  useEffect(() => {
    // Check if browser supports Speech Recognition
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as typeof window & {
          SpeechRecognition?: new () => SpeechRecognitionType;
          webkitSpeechRecognition?: new () => SpeechRecognitionType;
        }).SpeechRecognition ||
        (window as typeof window & {
          SpeechRecognition?: new () => SpeechRecognitionType;
          webkitSpeechRecognition?: new () => SpeechRecognitionType;
        }).webkitSpeechRecognition;

      if (SpeechRecognition) {
        setIsSupported(true);
        recognitionRef.current = new SpeechRecognition();

        // Configure recognition
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = "en-US";

        // Track final transcript across events
        let fullFinalTranscript = "";

        // Handle results
        recognitionRef.current.onresult = (
          event: SpeechRecognitionEventType
        ) => {
          let interimTranscript = "";

          // Use resultIndex to only process NEW results, not all results again
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptPiece = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              // Add to persistent final transcript
              fullFinalTranscript += transcriptPiece + " ";

              // Clear any existing silence timer
              if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current);
              }

              // Set timer to auto-stop after 1.5 seconds of silence
              silenceTimerRef.current = setTimeout(() => {
                if (recognitionRef.current) {
                  recognitionRef.current.stop();
                }
              }, 1500);
            } else {
              // Interim results (live typing effect)
              interimTranscript += transcriptPiece;
            }
          }

          // Update transcript: only final + current interim
          setTranscript(fullFinalTranscript + interimTranscript);
        };

        // Handle start
        recognitionRef.current.onstart = () => {
          setIsListening(true);
          setError(null);
          // Reset the full final transcript when starting fresh
          fullFinalTranscript = "";
          // Play start sound (higher pitch)
          playSound(800, 0.1);
        };

        // Handle end
        recognitionRef.current.onend = () => {
          setIsListening(false);
          // Play stop sound (lower pitch)
          playSound(400, 0.1);
          // Signal that speaking is finished
          setHasFinishedSpeaking(true);
          // Clear silence timer
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
        };

        // Handle errors
        recognitionRef.current.onerror = (
          event: SpeechRecognitionErrorEvent
        ) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);

          switch (event.error) {
            case "no-speech":
              setError("No speech detected. Please try again.");
              break;
            case "audio-capture":
              setError("No microphone found. Please check your device.");
              break;
            case "not-allowed":
              setError(
                "Microphone access denied. Please allow microphone access."
              );
              break;
            case "network":
              setError("Network error. Please check your connection.");
              break;
            default:
              setError(`Error: ${event.error}`);
          }
        };
      } else {
        setIsSupported(false);
        setError(
          "Speech recognition is not supported in this browser. Please use Chrome or Edge."
        );
      }
    }

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, [playSound]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && isSupported) {
      try {
        setError(null);
        setTranscript("");
        setHasFinishedSpeaking(false);
        recognitionRef.current.start();
      } catch (err) {
        console.error("Error starting recognition:", err);
        setError("Failed to start listening. Please try again.");
      }
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      // Clear silence timer when manually stopping
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    setHasFinishedSpeaking(false);
  }, []);

  return {
    transcript,
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
    hasFinishedSpeaking,
  };
}
