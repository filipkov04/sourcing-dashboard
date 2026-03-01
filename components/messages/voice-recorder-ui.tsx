"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVoiceRecorder, createVoiceFile } from "@/lib/use-voice-recorder";

interface VoiceRecorderUIProps {
  onSend: (file: File) => void;
  onCancel: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VoiceRecorderUI({ onSend, onCancel }: VoiceRecorderUIProps) {
  const {
    isRecording,
    duration,
    waveformData,
    startRecording,
    stopRecording,
    cancelRecording,
    audioBlob,
  } = useVoiceRecorder();

  const [started, setStarted] = useState(false);
  const cancelThresholdRef = useRef(false);

  // Start recording on mount
  useEffect(() => {
    if (!started) {
      setStarted(true);
      startRecording();
    }
  }, [started, startRecording]);

  // When blob is ready, send it
  useEffect(() => {
    if (audioBlob) {
      const file = createVoiceFile(audioBlob);
      onSend(file);
    }
  }, [audioBlob, onSend]);

  function handleCancel() {
    cancelRecording();
    onCancel();
  }

  function handleStop() {
    stopRecording();
  }

  // Track slide-to-cancel
  function handlePointerMove(e: React.PointerEvent) {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    cancelThresholdRef.current = offsetX < -100;
  }

  function handlePointerUp() {
    if (cancelThresholdRef.current) {
      handleCancel();
    }
  }

  return (
    <div
      className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-950/30"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Cancel button */}
      <button
        onClick={handleCancel}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Waveform visualization — scrolling bars */}
      <div className="flex flex-1 items-end gap-[2px] h-10 overflow-hidden">
        {waveformData.map((bar, i) => (
          <div
            key={i}
            className="w-[3px] shrink-0 rounded-full bg-red-400 dark:bg-red-400"
            style={{ height: `${Math.max(3, bar * 36)}px` }}
          />
        ))}
      </div>

      {/* Duration */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-sm font-medium tabular-nums text-red-600 dark:text-red-400">
          {formatDuration(duration)}
        </span>
      </div>

      {/* Send button */}
      <button
        onClick={handleStop}
        disabled={!isRecording}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200",
          isRecording
            ? "bg-gradient-to-br from-[#FF0F0F] to-[#FFB21A] text-white shadow-sm shadow-[#FF4D15]/20 hover:shadow-md hover:scale-105"
            : "bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-zinc-500"
        )}
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
}

/** Simple mic button that toggles voice recording mode */
interface VoiceMicButtonProps {
  onActivate: () => void;
  disabled?: boolean;
}

export function VoiceMicButton({ onActivate, disabled }: VoiceMicButtonProps) {
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (typeof navigator !== "undefined" && !navigator.mediaDevices?.getUserMedia) {
      setSupported(false);
    }
  }, []);

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={onActivate}
      disabled={disabled}
      title="Record voice message"
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
        disabled
          ? "text-gray-300 dark:text-zinc-600 cursor-not-allowed"
          : "text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
      )}
    >
      <Mic className="h-4 w-4" />
    </button>
  );
}
