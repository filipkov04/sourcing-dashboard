"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, Send, Loader2, Paperclip, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThreadReplies, sendReply, type Message } from "@/lib/use-conversations";
import { MessageAttachments } from "@/components/chat/message-attachment";
import { ChatDropZone } from "@/components/chat/chat-drop-zone";
import { CHAT_ALLOWED_EXTENSIONS } from "@/lib/chat-constants";

interface ThreadPanelProps {
  conversationId: string;
  parentMessage: Message;
  currentUserId: string;
  onClose: () => void;
}

function formatMessageTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function ThreadPanel({
  conversationId,
  parentMessage,
  currentUserId,
  onClose,
}: ThreadPanelProps) {
  const { replies, loading, refresh } = useThreadReplies(conversationId, parentMessage.id);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new replies
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies.length]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if ((!text && files.length === 0) || sending) return;
    setInput("");
    const currentFiles = [...files];
    setFiles([]);
    setSending(true);
    try {
      await sendReply(
        conversationId,
        parentMessage.id,
        text,
        currentFiles.length > 0 ? currentFiles : undefined
      );
      await refresh();
    } catch (err) {
      console.error("Failed to send reply:", err);
      setInput(text);
      setFiles(currentFiles);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [input, files, sending, conversationId, parentMessage.id, refresh]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const isOwnParent = parentMessage.senderId === currentUserId;

  return (
    <div className="flex h-full w-[360px] flex-col border-l border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[#FF4D15]" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Thread</h3>
          <span className="text-xs text-gray-400 dark:text-zinc-500">
            {replies.length} {replies.length === 1 ? "reply" : "replies"}
          </span>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Parent message */}
      <div className="border-b border-gray-100 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-start gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-900 dark:bg-zinc-700 text-[10px] font-bold text-white">
            {parentMessage.sender?.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-900 dark:text-white">
                {parentMessage.sender?.name || "Unknown"}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                {formatMessageTime(parentMessage.createdAt)}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-gray-600 dark:text-zinc-400 line-clamp-3 whitespace-pre-wrap">
              {parentMessage.deletedAt
                ? "This message was deleted"
                : parentMessage.content}
            </p>
            {parentMessage.attachments && parentMessage.attachments.length > 0 && (
              <div className="mt-1">
                <MessageAttachments attachments={parentMessage.attachments} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reply list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {loading && replies.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400 dark:text-zinc-500" />
          </div>
        ) : replies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-gray-400 dark:text-zinc-500">No replies yet</p>
            <p className="mt-1 text-xs text-gray-300 dark:text-zinc-600">Be the first to reply</p>
          </div>
        ) : (
          replies.map((reply) => {
            const isOwn = reply.senderId === currentUserId;
            return (
              <div key={reply.id} className={cn("flex gap-2 py-1.5", isOwn ? "flex-row-reverse" : "flex-row")}>
                {!isOwn && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900 dark:bg-zinc-700 text-[9px] font-bold text-white mt-0.5">
                    {reply.sender?.name?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
                <div className={cn("max-w-[80%]", isOwn ? "items-end" : "items-start")}>
                  {!isOwn && (
                    <span className="text-[10px] font-medium text-gray-500 dark:text-zinc-400 px-1">
                      {reply.sender?.name || "Unknown"}
                    </span>
                  )}
                  <div
                    className={cn(
                      "rounded-2xl px-3 py-2 text-[13px] leading-relaxed",
                      isOwn
                        ? "bg-gradient-to-br from-[#FF0F0F] to-[#FFB21A] text-white rounded-br-md shadow-sm shadow-[#FF4D15]/15"
                        : "bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 rounded-bl-md"
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">
                      {reply.deletedAt ? (
                        <span className="italic text-gray-400 dark:text-zinc-500">This message was deleted</span>
                      ) : (
                        reply.content
                      )}
                    </p>
                    {reply.attachments && reply.attachments.length > 0 && (
                      <MessageAttachments attachments={reply.attachments} isOwn={isOwn} />
                    )}
                  </div>
                  <p className={cn(
                    "mt-0.5 text-[9px] text-gray-400 dark:text-zinc-500 px-1",
                    isOwn ? "text-right" : "text-left"
                  )}>
                    {formatMessageTime(reply.createdAt)}
                    {reply.editedAt && " (edited)"}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply input */}
      <div className="border-t border-gray-100 dark:border-zinc-800 p-3">
        <ChatDropZone files={files} onFilesChange={setFiles}>
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors mb-0.5"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={CHAT_ALLOWED_EXTENSIONS}
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  setFiles((prev) => [...prev, ...Array.from(e.target.files!)].slice(0, 5));
                  e.target.value = "";
                }
              }}
            />
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Reply in thread..."
              rows={1}
              className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-[#FF4D15] focus:outline-none focus:ring-1 focus:ring-[#FF4D15]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-400 transition-colors"
              style={{ maxHeight: "120px" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
              }}
            />
            <button
              onClick={handleSend}
              disabled={(!input.trim() && files.length === 0) || sending}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-200 mb-0.5",
                (input.trim() || files.length > 0) && !sending
                  ? "bg-gradient-to-br from-[#FF0F0F] to-[#FFB21A] text-white shadow-sm shadow-[#FF4D15]/20 hover:shadow-md hover:scale-105"
                  : "bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-zinc-500"
              )}
            >
              {sending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </ChatDropZone>
      </div>
    </div>
  );
}
