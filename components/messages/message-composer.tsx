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
  const [micError, setMicError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isRecording,
    duration,
    analyserNode,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useAudioRecorder();

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

  // Tap-to-record: tap mic to start, tap send to stop & send, tap trash to cancel
  const handleMicTap = useCallback(async () => {
    try {
      setMicError("");
      await startRecording();
    } catch {
      setMicError("Microphone access is required to record audio");
      setTimeout(() => setMicError(""), 4000);
    }
  }, [startRecording]);

  const handleRecordSend = useCallback(async () => {
    let audioFile: File | null = null;
    try {
      audioFile = await stopRecording();
    } catch {
      cancelRecording();
      setMicError("Failed to stop recording");
      setTimeout(() => setMicError(""), 4000);
      return;
    }

    if (!audioFile || audioFile.size === 0) {
      setMicError("Recording too short — try holding longer");
      setTimeout(() => setMicError(""), 4000);
      return;
    }

    setSending(true);
    try {
      await onSend("", [audioFile]);
    } catch (err) {
      console.error("Voice message send failed:", err);
      setMicError("Failed to send voice message");
      setTimeout(() => setMicError(""), 4000);
    } finally {
      setSending(false);
    }
  }, [stopRecording, cancelRecording, onSend]);

  const handleRecordCancel = useCallback(() => {
    cancelRecording();
  }, [cancelRecording]);

  const hasContent = input.trim() || files.length > 0;

  return (
    <div className="border-t border-gray-100 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      {micError && (
        <p className="mb-2 text-xs text-red-500">{micError}</p>
      )}
      <ChatDropZone files={files} onFilesChange={setFiles}>
        {isRecording ? (
          /* Recording UI — tap Cancel to discard, tap Send to send */
          <div className="flex items-center gap-3 px-2 py-1.5">
            {/* Cancel button */}
            <button
              onClick={handleRecordCancel}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-red-100 hover:text-red-500 dark:bg-zinc-800 dark:text-zinc-500 dark:hover:bg-red-900/30 dark:hover:text-red-400"
              title="Cancel recording"
            >
              <Trash2 className="h-4 w-4" />
            </button>

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
            </div>

            {/* Send recording button */}
            <button
              onClick={handleRecordSend}
              disabled={sending}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#F97316] to-[#d44a1a] text-white shadow-sm shadow-[#FF8C1A]/20 transition-all hover:shadow-md hover:scale-105"
              title="Send recording"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
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
              className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#FF8C1A] focus:outline-none focus:ring-2 focus:ring-[#FF8C1A]/10 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-400 transition-all disabled:opacity-50"
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
                    ? "bg-gradient-to-br from-[#F97316] to-[#d44a1a] text-white shadow-sm shadow-[#FF8C1A]/20 hover:shadow-md hover:scale-105"
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
                onClick={handleMicTap}
                disabled={disabled || sending}
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200",
                  !disabled && !sending
                    ? "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700 dark:hover:text-zinc-200 active:scale-95"
                    : "bg-gray-100 text-gray-300 dark:bg-zinc-800 dark:text-zinc-600"
                )}
                title="Record voice message"
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
