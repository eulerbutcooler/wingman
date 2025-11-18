"use client";

import { Mic, MicOff } from "lucide-react";

interface MicButtonProps {
  isListening: boolean;
  isSupported: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export default function MicButton({
  isListening,
  isSupported,
  onClick,
  disabled = false,
}: MicButtonProps) {
  if (!isSupported) {
    return null; // Don't show button if not supported
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        relative p-2 md:p-3 rounded-full cursor-pointer 
        focus:outline-none focus:ring-2 focus:ring-offset-1 
        disabled:opacity-50 disabled:cursor-not-allowed 
        transition-all duration-300 flex items-center justify-center shadow-md
        ${
          isListening
            ? "bg-navy text-white shadow-lg animate-pulse focus:ring-navy"
            : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-300 focus:ring-gray-400"
        }
      `}
      title={isListening ? "Stop recording" : "Start voice input"}
    >
      {isListening ? (
        <>
          <MicOff size={16} className="md:w-5 md:h-5" />
          {/* Pulsing red dot indicator */}
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
        </>
      ) : (
        <Mic size={16} className="md:w-5 md:h-5" />
      )}
    </button>
  );
}
