"use client";

import { useRef, useCallback, useEffect } from "react";
import { useChatStore } from "@/stores";

// Global variables for audio context and WebSocket
let audioContext: AudioContext | null = null;
let nextStartTime = 0;
let isPlaying = false;
let elevenlabsWs: WebSocket | null = null;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

interface ElevenLabsConfig {
  apiKey: string;
  voiceId: string;
  model?: string;
  outputFormat?: string;
}

interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
}

export function useElevenLabsTTS() {
  const { speakingIndex, setSpeakingIndex, setIsLoadingAudio } = useChatStore();
  const configRef = useRef<ElevenLabsConfig | null>(null);
  const chunkCountRef = useRef(0);
  const firstChunkTimeRef = useRef<number | null>(null);
  const requestStartTimeRef = useRef<number | null>(null);
  const currentMessageIndexRef = useRef<number | null>(null);

  // Initialize audio context
  const initAudio = useCallback(async () => {
    if (!audioContext) {
      const AudioContextConstructor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextConstructor) {
        throw new Error('AudioContext not supported in this browser');
      }
      audioContext = new AudioContextConstructor();
      await audioContext.resume();
      nextStartTime = audioContext.currentTime;
      console.log(`✅ Audio context created (state: ${audioContext.state})`);
    } else if (audioContext.state === 'suspended') {
      await audioContext.resume();
      console.log(`✅ Audio context resumed (state: ${audioContext.state})`);
    }
  }, []);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback(async (event: MessageEvent) => {
    try {
      const response = JSON.parse(event.data);

      // Audio chunk received
      if (response.audio) {
        chunkCountRef.current++;

        // Track latency for first chunk
        if (!firstChunkTimeRef.current && requestStartTimeRef.current) {
          firstChunkTimeRef.current = performance.now() - requestStartTimeRef.current;
          console.log(`⚡ First chunk received in ${firstChunkTimeRef.current.toFixed(0)}ms`);
        }

        // Decode base64 audio data
        const audioData = atob(response.audio);
        const bytes = new Uint8Array(audioData.length);
        for (let i = 0; i < audioData.length; i++) {
          bytes[i] = audioData.charCodeAt(i);
        }

        // Ensure audio context is ready
        if (!audioContext) {
          console.error('❌ Audio context not initialized!');
          return;
        }

        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        // Convert PCM Int16 to Float32
        const int16Array = new Int16Array(bytes.buffer);
        const float32Array = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) {
          float32Array[i] = int16Array[i] / 32768.0; // Normalize to -1.0 to 1.0
        }

        // Create audio buffer with exact sample rate (24000 Hz for pcm_24000)
        const audioBuffer = audioContext.createBuffer(1, float32Array.length, 24000);
        audioBuffer.getChannelData(0).set(float32Array);

        // GAPLESS PLAYBACK: Schedule audio precisely
        if (!isPlaying) {
          nextStartTime = audioContext.currentTime + 0.05; // Small initial buffer
          isPlaying = true;
        }

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start(nextStartTime); // Schedule at exact time

        // Update next start time for seamless playback
        nextStartTime += audioBuffer.duration;

        console.log(`📦 Chunk ${chunkCountRef.current} playing (${audioBuffer.duration.toFixed(2)}s)`);

        // Reset isPlaying when stream ends
        source.onended = () => {
          if (audioContext && audioContext.currentTime >= nextStartTime - 0.1) {
            isPlaying = false;
          }
        };
      }

      // Stream completion
      if (response.isFinal) {
        const totalTime = requestStartTimeRef.current
          ? (performance.now() - requestStartTimeRef.current).toFixed(0)
          : 'N/A';
        console.log(`✅ Stream complete (${chunkCountRef.current} chunks, ${totalTime}ms)`);
        
        // Reset state immediately
        chunkCountRef.current = 0;
        firstChunkTimeRef.current = null;
        requestStartTimeRef.current = null;
        
        // Stop loading immediately when stream completes
        setIsLoadingAudio(false);
        
        // Keep speaking index until audio actually finishes playing
        const estimatedEndTime = nextStartTime;
        if (audioContext && estimatedEndTime > audioContext.currentTime) {
          const remainingTime = (estimatedEndTime - audioContext.currentTime) * 1000;
          setTimeout(() => {
            setSpeakingIndex(null);
          }, Math.max(100, remainingTime));
        } else {
          // If audio already finished or no context, clear immediately
          setSpeakingIndex(null);
        }
      }

      // Error handling
      if (response.error) {
        console.error(`❌ ElevenLabs error: ${response.error}`);
        setSpeakingIndex(null);
        setIsLoadingAudio(false);
      }
    } catch (error) {
      console.error(`❌ Parse error:`, error);
    }
  }, [setIsLoadingAudio, setSpeakingIndex]);

  // Initialize ElevenLabs WebSocket
  const initElevenLabsWebSocket = useCallback(async () => {
    if (elevenlabsWs && elevenlabsWs.readyState === WebSocket.OPEN) {
      console.log('✅ WebSocket already connected');
      return true;
    }

    if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
      console.error('❌ Max connection attempts reached');
      return false;
    }

    try {
      // Fetch config from API
      const configResponse = await fetch('/api/tts/elevenlabs/config');
      const config = await configResponse.json();
      
      if (!configResponse.ok || config.error) {
        throw new Error(config.error || 'Failed to fetch ElevenLabs config');
      }
      
      configRef.current = config;

      const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${config.voiceId}/stream-input?model_id=${config.model || 'eleven_flash_v2_5'}&output_format=${config.outputFormat || 'pcm_24000'}`;

      elevenlabsWs = new WebSocket(wsUrl);

      return new Promise<boolean>((resolve) => {
        if (!elevenlabsWs) {
          resolve(false);
          return;
        }

        elevenlabsWs.onopen = () => {
          console.log('✅ ElevenLabs WebSocket connected');
          connectionAttempts = 0;

          // Send initial configuration
          const voiceSettings: VoiceSettings = {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0,
            use_speaker_boost: false,
          };

          elevenlabsWs?.send(
            JSON.stringify({
              text: ' ',
              voice_settings: voiceSettings,
              generation_config: {
                chunk_length_schedule: [120, 160, 250],
              },
              xi_api_key: config.apiKey,
            })
          );

          console.log('📤 Config sent, ready for streaming');
          resolve(true);
        };

        elevenlabsWs.onmessage = handleWebSocketMessage;

        elevenlabsWs.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          connectionAttempts++;
          resolve(false);
        };

        elevenlabsWs.onclose = (event) => {
          console.log(`🔌 WebSocket closed (code: ${event.code})`);
          elevenlabsWs = null;
          
          // Attempt reconnection if not a normal closure
          if (event.code !== 1000 && connectionAttempts < MAX_CONNECTION_ATTEMPTS) {
            console.log('🔄 Attempting to reconnect...');
            setTimeout(() => initElevenLabsWebSocket(), 1000);
          }
        };

        // Timeout after 5 seconds
        setTimeout(() => {
          if (elevenlabsWs?.readyState !== WebSocket.OPEN) {
            console.error('❌ WebSocket connection timeout');
            elevenlabsWs?.close();
            resolve(false);
          }
        }, 5000);
      });
    } catch (error) {
      console.error('❌ Failed to initialize WebSocket:', error);
      connectionAttempts++;
      return false;
    }
  }, [handleWebSocketMessage]);

  // Send text to ElevenLabs
  const sendTextToElevenLabs = useCallback((text: string) => {
    if (!elevenlabsWs || elevenlabsWs.readyState !== WebSocket.OPEN) {
      console.error('❌ WebSocket not connected');
      return false;
    }

    if (!text || text.trim().length === 0) {
      console.error('❌ No text to convert');
      return false;
    }

    // Clean markdown from text
    const cleanText = text
      .replace(/\*\*(.+?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.+?)\*/g, '$1') // Remove italic
      .replace(/`(.+?)`/g, '$1') // Remove code
      .replace(/\[(.+?)\]\(.+?\)/g, '$1') // Remove links, keep text
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/>\s/g, '') // Remove blockquotes
      .replace(/\n+/g, '. ') // Replace newlines with pauses
      .substring(0, 5000); // ElevenLabs limit

    // Track request timing
    requestStartTimeRef.current = performance.now();

    // Send text for generation
    elevenlabsWs.send(
      JSON.stringify({
        text: cleanText + ' ',
        try_trigger_generation: true,
      })
    );

    console.log(`📤 Sent ${cleanText.length} characters for conversion`);

    // Signal end of input by sending empty message with flush
    // This tells ElevenLabs we're done sending text and to process all remaining audio
    setTimeout(() => {
      if (elevenlabsWs && elevenlabsWs.readyState === WebSocket.OPEN) {
        elevenlabsWs.send(JSON.stringify({ text: '' }));
        console.log('📤 Sent end-of-stream signal');
      }
    }, 100); // Small delay to ensure text is sent first

    return true;
  }, []);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    // Reset audio state WITHOUT closing the context
    // This allows the context to be reused for the next TTS call
    if (audioContext) {
      // Just reset the timing variables, don't close the context
      isPlaying = false;
      nextStartTime = audioContext.currentTime; // Reset to current time for next play
      console.log('🛑 Audio playback stopped (context kept alive)');
    }
    
    // Stop browser TTS fallback
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    
    setSpeakingIndex(null);
    setIsLoadingAudio(false);
    chunkCountRef.current = 0;
    firstChunkTimeRef.current = null;
    requestStartTimeRef.current = null;
  }, [setSpeakingIndex, setIsLoadingAudio]);

  // Speak text
  const speakText = useCallback(
    async (text: string, messageIndex: number) => {
      // Stop any current playback
      stopSpeaking();

      try {
        setIsLoadingAudio(true);
        setSpeakingIndex(messageIndex);
        currentMessageIndexRef.current = messageIndex;

        console.log('🔊 [ElevenLabs] Requesting TTS for message', messageIndex);

        // Initialize audio context
        await initAudio();

        // Ensure WebSocket is connected
        const isConnected = await initElevenLabsWebSocket();
        if (!isConnected) {
          throw new Error('Failed to connect to ElevenLabs');
        }

        // Wait a bit for WebSocket to be fully ready
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Send text for conversion
        const success = sendTextToElevenLabs(text);
        if (!success) {
          throw new Error('Failed to send text to ElevenLabs');
        }

        // Loading will be set to false when stream completes
      } catch (error) {
        console.warn('⚠️ [ElevenLabs] Failed, falling back to browser TTS:', error);
        
        // Fallback to browser Web Speech API
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          console.log('🔄 [Browser TTS] Starting fallback audio playback...');
          
          // Cancel any ongoing speech first
          window.speechSynthesis.cancel();
          
          try {
            // Clean markdown from text
            const cleanText = text
              .replace(/\*\*(.+?)\*\*/g, '$1')
              .replace(/\*(.+?)\*/g, '$1')
              .replace(/`(.+?)`/g, '$1')
              .replace(/\[(.+?)\]\(.+?\)/g, '$1')
              .replace(/#{1,6}\s/g, '')
              .replace(/>\s/g, '')
              .replace(/\n+/g, '. ');

            // Wait for voices to be loaded (critical for browser TTS)
            const waitForVoices = () => {
              return new Promise<SpeechSynthesisVoice[]>((resolve) => {
                let voices = window.speechSynthesis.getVoices();
                if (voices.length > 0) {
                  resolve(voices);
                } else {
                  window.speechSynthesis.onvoiceschanged = () => {
                    voices = window.speechSynthesis.getVoices();
                    if (voices.length > 0) {
                      resolve(voices);
                    }
                  };
                  // Force trigger
                  setTimeout(() => {
                    voices = window.speechSynthesis.getVoices();
                    resolve(voices);
                  }, 100);
                }
              });
            };

            const voices = await waitForVoices();
            console.log(`🎤 [Browser TTS] Loaded ${voices.length} voices`);

            // Create utterance
            const utterance = new SpeechSynthesisUtterance(cleanText);

            // Set optimal settings for Hindi as per guide
            utterance.rate = 0.9;   // Slightly slower for clarity
            utterance.pitch = 1.1;  // Higher pitch for natural Hindi tone
            utterance.volume = 1.0;
            utterance.lang = 'hi-IN';

            // Find best Hindi voice (prioritize Google Hindi as per guide)
            const hindiVoice = 
              voices.find(v => v.lang === 'hi-IN' && v.name.toLowerCase().includes('google')) ||
              voices.find(v => v.lang === 'hi-IN') ||
              voices.find(v => v.lang === 'en-IN') ||
              voices.find(v => v.lang.includes('IN')) ||
              voices.find(v => v.lang.startsWith('en')) ||
              voices[0];

            if (hindiVoice) {
              utterance.voice = hindiVoice;
              console.log(`🎤 [Browser TTS] Selected voice: ${hindiVoice.name} (${hindiVoice.lang})`);
            } else {
              console.warn('⚠️ [Browser TTS] No suitable voice found, using default');
            }

            // Event handlers
            utterance.onstart = () => {
              console.log("▶️  [Browser TTS] Speech started");
              setIsLoadingAudio(false);
            };

            utterance.onend = () => {
              console.log("✅ [Browser TTS] Speech finished");
              setSpeakingIndex(null);
              setIsLoadingAudio(false);
            };

            utterance.onerror = (event) => {
              console.error("❌ [Browser TTS] Error:", event.error);
              setSpeakingIndex(null);
              setIsLoadingAudio(false);
            };

            utterance.onpause = () => {
              console.log("⏸️ [Browser TTS] Speech paused");
            };

            utterance.onresume = () => {
              console.log("▶️  [Browser TTS] Speech resumed");
            };

            // Resume if paused
            if (window.speechSynthesis.paused) {
              window.speechSynthesis.resume();
            }

            // Speak!
            window.speechSynthesis.speak(utterance);
            console.log("📢 [Browser TTS] Utterance queued, speaking...");
            
            // Verify it's actually speaking
            setTimeout(() => {
              if (window.speechSynthesis.speaking) {
                console.log("✅ [Browser TTS] Confirmed: Speech is active");
              } else {
                console.error("❌ [Browser TTS] Speech not active after 500ms");
              }
            }, 500);
          } catch (fallbackError) {
            console.error("❌ [Browser TTS] Fallback error:", fallbackError);
            setSpeakingIndex(null);
            setIsLoadingAudio(false);
          }
        } else {
          console.error("❌ Browser TTS not supported");
          setSpeakingIndex(null);
          setIsLoadingAudio(false);
        }
      }
    },
    [stopSpeaking, setIsLoadingAudio, setSpeakingIndex, initAudio, initElevenLabsWebSocket, sendTextToElevenLabs]
  );

  // Toggle speak
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (elevenlabsWs) {
        elevenlabsWs.close();
        elevenlabsWs = null;
      }
      if (audioContext) {
        audioContext.close();
        audioContext = null;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    speakText,
    stopSpeaking,
    toggleSpeak,
  };
}
