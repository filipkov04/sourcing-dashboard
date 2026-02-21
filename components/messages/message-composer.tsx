"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Send, Loader2, Paperclip, Smile, Mic, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatDropZone } from "@/components/chat/chat-drop-zone";
import { EmojiPicker } from "./emoji-picker";
import { useAudioRecorder } from "@/lib/use-audio-recorder";

interface MessageComposerProps {
  onSend: (content: string, files?: File[]) => Promise<void>;
  onTyping?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

function formatRecordingTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function LiveWaveform({ analyserNode }: { analyserNode: AnalyserNode | null }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<HTMLDivElement[]>([]);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!analyserNode) return;

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const barCount = 24;

    function draw() {
      analyserNode!.getByteFrequencyData(dataArray);

      // Sample evenly from frequency data
      for (let i = 0; i < barCount; i++) {
        const idx = Math.floor((i / barCount) * bufferLength);
        const value = dataArray[idx] / 255;
        const height = Math.max(3, value * 24);
        if (barsRef.current[i]) {
          barsRef.current[i].style.height = `${height}px`;
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [analyserNode]);

  return (
    <div ref={canvasRef} className="flex items-center gap-[2px] h-6">
      {Array.from({ length: 24 }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            if (el) barsRef.current[i] = el;
          }}
          className="w-[3px] rounded-full bg-red-400 transition-[height] duration-75"
          style={{ height: "3px" }}
        />
      ))}
    </div>
  );
}

export function MessageComposer({
  onSend,
  onTyping,
  placeholder = "Type a message...",
  disabled = false,
}: MessageComposerProps) {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [overTrash, setOverTrash] = useState(false);
  const [micError, setMicError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const trashRef = useRef<HTMLDivElement>(null);
  const overTrashRef = useRef(false);
  const handledByReactRef = useRef(false);

  const {
    isRecording,
    duration,
    analyserNode,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useAudioRecorder();

  // Keep refs in sync for global listener
  const durationRef = useRef(duration);
  durationRef.current = duration;

  const handleSend = useCallback(async () => {
    if ((!input.trim() && files.length === 0) || sending || disabled) return;
    const content = input.trim();
    const filesToSend = [...files];
    setInput("");
    setFiles([]);
    setSending(true);
    try {
      await onSend(content, filesToSend.length > 0 ? filesToSend : undefined);
    } catch {
      setInput(content);
      setFiles(filesToSend);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [input, files, sending, disabled, onSend]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
    e.target.value = "";
  }

  function handleEmojiInsert(emoji: string) {
    setInput((prev) => prev + emoji);
    inputRef.current?.focus();
  }

  // Hold-to-record handlers
  const handleMicDown = useCallback(
    async (e: React.PointerEvent) => {
      e.preventDefault();
      try {
        setMicError("");
        await startRecording();
      } catch {
        setMicError("Microphone access is required to record audio");
        setTimeout(() => setMicError(""), 4000);
      }
    },
    [startRecording]
  );

  const finishRecording = useCallback(async () => {
    try {
      if (overTrashRef.current) {
        cancelRecording();
        setOverTrash(false);
        overTrashRef.current = false;
        return;
      }

      if (durationRef.current < 0.5) {
        cancelRecording();
        return;
      }

      const audioFile = await stopRecording();
      if (audioFile.size > 0) {
        setSending(true);
        try {
          await onSend("", [audioFile]);
        } finally {
          setSending(false);
        }
      }
    } catch {
      cancelRecording();
    }
  }, [stopRecording, cancelRecording, onSend]);

  const handlePointerUp = useCallback(() => {
    if (!isRecording) return;
    handledByReactRef.current = true;
    finishRecording();
  }, [isRecording, finishRecording]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isRecording || !trashRef.current) return;
      const rect = trashRef.current.getBoundingClientRect();
      const isOver =
        e.clientX >= rect.left - 16 &&
        e.clientX <= rect.right + 16 &&
        e.clientY >= rect.top - 16 &&
        e.clientY <= rect.bottom + 16;
      setOverTrash(isOver);
      overTrashRef.current = isOver;
    },
    [isRecording]
  );

  // Global pointer up listener — catches releases outside the component
  useEffect(() => {
    if (!isRecording) return;
    handledByReactRef.current = false;

    const handleGlobalUp = () => {
      // Small delay to let React's onPointerUp fire first
      setTimeout(() => {
        if (!handledByReactRef.current) {
          finishRecording();
        }
      }, 0);
    };

    window.addEventListener("pointerup", handleGlobalUp);
    return () => window.removeEventListener("pointerup", handleGlobalUp);
  }, [isRecording, finishRecording]);

  const hasContent = input.trim() || files.length > 0;

  return (
    <div
      className="border-t border-gray-100 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
    >
      {micError && (
        <p className="mb-2 text-xs text-red-500">{micError}</p>
      )}
      <ChatDropZone files={files} onFilesChange={setFiles}>
        {isRecording ? (
          /* Recording UI */
          <div className="flex items-center gap-3 px-2 py-1.5">
            {/* Trash zone */}
            <div
              ref={trashRef}
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all",
                overTrash
                  ? "bg-red-500 text-white scale-110"
                  : "bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-zinc-500"
              )}
            >
              <Trash2 className="h-4 w-4" />
            </div>

            {/* Recording indicator */}
            <div className="flex flex-1 items-center gap-3 rounded-xl bg-gray-50 dark:bg-zinc-800 px-4 py-2.5">
              {/* Pulsing red dot */}
              <div className="relative flex h-3 w-3 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
              </div>

              {/* Timer */}
              <span className="text-sm font-medium tabular-nums text-gray-700 dark:text-zinc-300">
                {formatRecordingTime(duration)}
              </span>

              {/* Live waveform */}
              <LiveWaveform analyserNode={analyserNode} />

              {/* Hint */}
              <span className="ml-auto text-xs text-gray-400 dark:text-zinc-500">
                {overTrash ? "Release to cancel" : "Release to send"}
              </span>
            </div>
          </div>
        ) : (
          /* Normal composer UI */
          <div className="flex items-end gap-2">
            {/* Attach button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              title="Attach file"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Textarea */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                onTyping?.();
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={1}
              disabled={disabled}
              className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#EB5D2E] focus:outline-none focus:ring-2 focus:ring-[#EB5D2E]/10 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-400 transition-all disabled:opacity-50"
              style={{ maxHeight: "120px" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, 120) + "px";
              }}
            />

            {/* Emoji button */}
            <div className="relative">
              <button
                onClick={() => setShowEmoji(!showEmoji)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                title="Insert emoji"
              >
                <Smile className="h-4 w-4" />
              </button>
              {showEmoji && (
                <div className="absolute bottom-full right-0 mb-2">
                  <EmojiPicker onSelect={handleEmojiInsert} onClose={() => setShowEmoji(false)} />
                </div>
              )}
            </div>

            {/* Send or Mic button */}
            {hasContent ? (
              <button
                onClick={handleSend}
                disabled={(!input.trim() && files.length === 0) || sending || disabled}
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200",
                  !sending && !disabled
                    ? "bg-gradient-to-br from-[#EB5D2E] to-[#d44a1a] text-white shadow-sm shadow-[#EB5D2E]/20 hover:shadow-md hover:scale-105"
                    : "bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-zinc-500"
                )}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            ) : (
              <button
                onPointerDown={handleMicDown}
                disabled={disabled || sending}
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 touch-none select-none",
                  !disabled && !sending
                    ? "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200 active:scale-95"
                    : "bg-gray-100 text-gray-300 dark:bg-zinc-800 dark:text-zinc-600"
                )}
                title="Hold to record voice message"
              >
                <Mic className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </ChatDropZone>
    </div>
  );
}
