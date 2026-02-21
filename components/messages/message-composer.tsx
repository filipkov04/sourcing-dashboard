"use client";

import { useState, useRef, useCallback } from "react";
import { Send, Loader2, Paperclip, Smile } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatDropZone } from "@/components/chat/chat-drop-zone";
import { EmojiPicker } from "./emoji-picker";

interface MessageComposerProps {
  onSend: (content: string, files?: File[]) => Promise<void>;
  onTyping?: () => void;
  placeholder?: string;
  disabled?: boolean;
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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="border-t border-gray-100 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      <ChatDropZone files={files} onFilesChange={setFiles}>
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

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={(!input.trim() && files.length === 0) || sending || disabled}
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200",
              (input.trim() || files.length > 0) && !sending && !disabled
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
        </div>
      </ChatDropZone>
    </div>
  );
}
