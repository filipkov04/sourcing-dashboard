"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Send,
  Paperclip,
  Smile,
  Mic,
  X,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CHAT_ALLOWED_EXTENSIONS,
  CHAT_ALLOWED_FILE_TYPES,
  CHAT_MAX_FILE_SIZE,
} from "@/lib/chat-constants";
import type { Message } from "@/lib/use-conversations";
import { EmojiPickerPopover } from "./emoji-picker-popover";
import { RequestCardPreview, type RequestCardData } from "./request-card";

/* ─── Helpers ─── */

const MAX_CHARS = 5000;
const CHAR_WARNING_THRESHOLD = 4500;
const MAX_LINES = 6;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return ImageIcon;
  if (type.startsWith("video/")) return Film;
  if (type.startsWith("audio/")) return Music;
  return FileText;
}

/* ─── Props ─── */

interface MessageInputProps {
  onSend: (content: string, files: File[], requestAttachment?: RequestCardData) => void;
  onTyping: () => void;
  onVoiceRecord: () => void;
  editingMessage: Message | null;
  onEditCancel: () => void;
  onEditSave: (content: string) => void;
  disabled?: boolean;
  attachedRequest?: RequestCardData | null;
  onDismissRequest?: () => void;
}

/* ─── Component ─── */

export function MessageInput({
  onSend,
  onTyping,
  onVoiceRecord,
  editingMessage,
  onEditCancel,
  onEditSave,
  disabled = false,
  attachedRequest,
  onDismissRequest,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCountRef = useRef(0);

  // Pre-fill content when editing
  useEffect(() => {
    if (editingMessage) {
      setContent(editingMessage.content);
      textareaRef.current?.focus();
    } else {
      setContent("");
    }
  }, [editingMessage]);

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    // Single line height ~36px, 6 lines ~166px
    const maxHeight = 166;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [content, adjustHeight]);

  // Send handler
  function handleSend() {
    const trimmed = content.trim();
    if (!trimmed && files.length === 0 && !attachedRequest) return;
    if (editingMessage) {
      if (trimmed) onEditSave(trimmed);
      return;
    }
    onSend(trimmed, files, attachedRequest ?? undefined);
    setContent("");
    setFiles([]);
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  // Keyboard handling
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Content change with typing callback
  function handleContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    if (value.length <= MAX_CHARS) {
      setContent(value);
      onTyping();
    }
  }

  // File handling
  function addFiles(newFiles: FileList | File[]) {
    const validFiles = Array.from(newFiles).filter(
      (f) => f.size <= CHAT_MAX_FILE_SIZE && CHAT_ALLOWED_FILE_TYPES.includes(f.type)
    );
    setFiles((prev) => [...prev, ...validFiles].slice(0, 5));
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      addFiles(e.target.files);
      e.target.value = "";
    }
  }

  // Drag-drop
  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current++;
    setDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current--;
    if (dragCountRef.current === 0) setDragging(false);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCountRef.current = 0;
    setDragging(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }

  const canSend = (content.trim().length > 0 || files.length > 0 || !!attachedRequest) && !disabled;
  const showCharCount = content.length >= CHAR_WARNING_THRESHOLD;

  return (
    <div
      className="relative border-t border-gray-200 dark:border-zinc-700/50 bg-white dark:bg-zinc-900"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {dragging && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-[#FF4D15] bg-[#FF4D15]/10">
          <p className="text-sm font-medium text-[#FF4D15]">Drop files here</p>
        </div>
      )}

      {/* Edit banner */}
      {editingMessage && (
        <div className="flex items-center justify-between bg-[#FF4D15]/5 border-b border-[#FF4D15]/20 px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="h-4 w-0.5 rounded-full bg-[#FF4D15]" />
            <span className="text-xs font-medium text-[#FF4D15]">Editing message</span>
          </div>
          <button
            onClick={onEditCancel}
            className="flex h-5 w-5 items-center justify-center rounded text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Attached request preview */}
      {attachedRequest && (
        <div className="px-4 py-2 border-b border-gray-100 dark:border-zinc-800">
          <RequestCardPreview request={attachedRequest} onDismiss={onDismissRequest ?? (() => {})} />
        </div>
      )}

      {/* File preview row */}
      {files.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-2 border-b border-gray-100 dark:border-zinc-800">
          {files.map((file, i) => {
            const Icon = getFileIcon(file.type);
            const isImage = file.type.startsWith("image/");
            return (
              <div
                key={`${file.name}-${i}`}
                className="relative flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 px-2 py-1.5"
              >
                {isImage ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="h-8 w-8 rounded object-cover"
                  />
                ) : (
                  <Icon className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
                )}
                <div className="max-w-[100px]">
                  <p className="truncate text-[10px] font-medium text-gray-700 dark:text-zinc-300">
                    {file.name}
                  </p>
                  <p className="text-[9px] text-gray-400 dark:text-zinc-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  onClick={() => removeFile(i)}
                  className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 dark:bg-zinc-600 hover:bg-gray-300 dark:hover:bg-zinc-500 transition-colors"
                >
                  <X className="h-2.5 w-2.5 text-gray-600 dark:text-zinc-300" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-center gap-2 px-4 py-3">
        {/* Attachment button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors disabled:opacity-40"
          title="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={CHAT_ALLOWED_EXTENSIONS}
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Textarea */}
        <div className="relative min-w-0 flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            disabled={disabled}
            className={cn(
              "w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400",
              "focus:border-[#FF4D15] focus:outline-none focus:ring-1 focus:ring-[#FF4D15]/20",
              "dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-400",
              "transition-colors disabled:opacity-50"
            )}
            style={{ maxHeight: "166px" }}
          />
          {/* Character counter */}
          {showCharCount && (
            <span
              className={cn(
                "absolute bottom-1 right-2 text-[10px] tabular-nums",
                content.length >= MAX_CHARS
                  ? "text-red-500"
                  : "text-gray-400 dark:text-zinc-500"
              )}
            >
              {content.length}/{MAX_CHARS}
            </span>
          )}
        </div>

        {/* Emoji picker */}
        <EmojiPickerPopover
          onSelect={(emoji) => {
            setContent((prev) => prev + emoji);
            textareaRef.current?.focus();
          }}
        >
          <button
            type="button"
            disabled={disabled}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors disabled:opacity-40"
            title="Add emoji"
          >
            <Smile className="h-4 w-4" />
          </button>
        </EmojiPickerPopover>

        {/* Mic button */}
        {!editingMessage && (
          <button
            onClick={onVoiceRecord}
            disabled={disabled}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors disabled:opacity-40"
            title="Voice message"
          >
            <Mic className="h-4 w-4" />
          </button>
        )}

        {/* Send / Save button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200",
            canSend
              ? "bg-gradient-to-br from-[#FF0F0F] to-[#FFB21A] text-white shadow-sm shadow-[#FF4D15]/20 hover:shadow-md hover:scale-105"
              : "bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-zinc-500"
          )}
          title={editingMessage ? "Save edit" : "Send message"}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
