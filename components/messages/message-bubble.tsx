"use client";

import { useState } from "react";
import {
  Reply,
  Forward,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Trash2,
  SmilePlus,
  FileText,
  Download,
  Film,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VoiceMessagePlayer } from "./voice-message-player";
import type { Message } from "@/lib/use-conversations";

/* ─── Quick emoji set ─── */

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

/* ─── Helpers ─── */

function formatMessageTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ─── Props ─── */

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  currentUserId: string;
  showSender: boolean;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onReact: (emoji: string) => void;
  onThreadOpen: () => void;
  onForward: () => void;
  onImageClick: (url: string) => void;
}

/* ─── Component ─── */

export function MessageBubble({
  message,
  isOwn,
  currentUserId,
  showSender,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onThreadOpen,
  onForward,
  onImageClick,
}: MessageBubbleProps) {
  const [hovered, setHovered] = useState(false);
  const [showEmojiBar, setShowEmojiBar] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const isSystem = message.messageType === "SYSTEM";
  const isBot = message.messageType === "BOT";
  const isDeleted = !!message.deletedAt;

  // ── System / BOT messages ──
  if (isSystem || isBot) {
    return (
      <div className="flex justify-center py-1.5">
        <span className="rounded-full bg-gray-100 dark:bg-zinc-800/80 px-3.5 py-1.5 text-[11px] text-gray-500 dark:text-zinc-400">
          {message.content}
        </span>
      </div>
    );
  }

  // ── Deleted messages ──
  if (isDeleted) {
    return (
      <div className={cn("flex py-1", isOwn ? "justify-end" : "justify-start")}>
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-[13px] italic",
            isOwn
              ? "rounded-br-md bg-gray-100 dark:bg-zinc-800/60 text-gray-400 dark:text-zinc-500"
              : "rounded-bl-md bg-gray-100 dark:bg-zinc-800/60 text-gray-400 dark:text-zinc-500"
          )}
        >
          This message was deleted
        </div>
      </div>
    );
  }

  // ── Group reactions by emoji ──
  const reactionGroups: { emoji: string; count: number; userReacted: boolean }[] = [];
  if (message.reactions && message.reactions.length > 0) {
    const map = new Map<string, { count: number; userReacted: boolean }>();
    for (const r of message.reactions) {
      const existing = map.get(r.emoji);
      if (existing) {
        existing.count++;
        if (r.userId === currentUserId) existing.userReacted = true;
      } else {
        map.set(r.emoji, { count: 1, userReacted: r.userId === currentUserId });
      }
    }
    for (const [emoji, data] of map) {
      reactionGroups.push({ emoji, ...data });
    }
  }

  // ── Attachment rendering ──
  function renderAttachments() {
    if (!message.attachments || message.attachments.length === 0) return null;

    return (
      <div className="mt-1.5 space-y-1">
        {message.attachments.map((att) => {
          const url = att.url || "";
          const isImage = att.fileType.startsWith("image/");
          const isVideo = att.fileType.startsWith("video/");
          const isAudio = att.fileType.startsWith("audio/");

          if (isImage && url) {
            return (
              <button
                key={att.id}
                onClick={() => onImageClick(url)}
                className="block overflow-hidden rounded-lg cursor-pointer"
              >
                <img
                  src={url}
                  alt={att.fileName}
                  className="max-w-[300px] max-h-52 rounded-lg object-cover hover:opacity-90 transition-opacity"
                  loading="lazy"
                />
              </button>
            );
          }

          if (isVideo && url) {
            return (
              <video
                key={att.id}
                src={url}
                controls
                className="max-w-[300px] rounded-lg"
                preload="metadata"
              />
            );
          }

          if (isAudio && url) {
            return (
              <div key={att.id}>
                <VoiceMessagePlayer url={url} />
              </div>
            );
          }

          // Generic file
          const FileIcon = att.fileType.startsWith("video/") ? Film : FileText;
          return (
            <div
              key={att.id}
              className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 px-3 py-2"
            >
              <FileIcon className="h-5 w-5 shrink-0 text-blue-500" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-gray-700 dark:text-zinc-300">
                  {att.fileName}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                  {formatFileSize(att.fileSize)}
                </p>
              </div>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                title="Download"
              >
                <Download className="h-3.5 w-3.5 text-gray-500 dark:text-zinc-400" />
              </a>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={cn("group relative flex gap-2 py-1", isOwn ? "flex-row-reverse" : "flex-row")}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setShowEmojiBar(false);
        setShowDropdown(false);
      }}
    >
      <div className={cn("relative max-w-[75%]", isOwn ? "items-end" : "items-start")}>
        {/* Forwarded header */}
        {message.forwardedFromId && message.forwardedFrom && (
          <div
            className={cn(
              "mb-1 flex items-center gap-1 text-[11px] text-gray-400 dark:text-zinc-500",
              isOwn ? "justify-end" : "justify-start"
            )}
          >
            <Forward className="h-3 w-3" />
            <span>
              Forwarded from{" "}
              <span className="font-medium">
                {message.forwardedFrom.sender?.name || "Unknown"}
              </span>
            </span>
          </div>
        )}

        {/* Sender name */}
        {showSender && !isOwn && message.sender?.name && (
          <p className="mb-0.5 px-1 text-[11px] font-semibold text-gray-600 dark:text-zinc-400">
            {message.sender.name}
          </p>
        )}

        {/* Bubble */}
        <div
          className={cn(
            "rounded-2xl text-[13px] leading-relaxed",
            message.attachments?.length && message.attachments.every((a) => a.fileType.startsWith("audio/"))
              ? ""
              : cn(
                  "px-3 py-2.5",
                  isOwn
                    ? "bg-[#FF4D15] text-white rounded-br-md shadow-sm shadow-[#FF4D15]/15"
                    : "bg-white dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 rounded-bl-md shadow-sm border border-gray-100 dark:border-zinc-700/50"
                )
          )}
        >
          {/* Hide auto-generated "Shared N file" text when all attachments are audio/voice */}
          {(() => {
            const hasAttachments = message.attachments && message.attachments.length > 0;
            const allAudio = hasAttachments && message.attachments!.every((a) => a.fileType.startsWith("audio/"));
            const isAutoText = /^Shared \d+ files?$/.test(message.content);
            if (allAudio && isAutoText) return null;
            if (!message.content.trim()) return null;
            return <p className="whitespace-pre-wrap break-words">{message.content}</p>;
          })()}
          {renderAttachments()}
          {message.editedAt && (
            <span
              className={cn(
                "ml-1 text-[10px] italic",
                isOwn ? "text-white/60" : "text-gray-400 dark:text-zinc-500"
              )}
            >
              (edited)
            </span>
          )}
        </div>

        {/* Thread preview */}
        {(message.threadCount ?? 0) > 0 && (
          <button
            onClick={onThreadOpen}
            className="mt-1 px-1 text-[11px] font-medium text-[#FF4D15] hover:underline"
          >
            {message.threadCount} {message.threadCount === 1 ? "reply" : "replies"}
          </button>
        )}

        {/* Reaction pills */}
        {reactionGroups.length > 0 && (
          <div className={cn("mt-1 flex flex-wrap gap-1", isOwn ? "justify-end" : "justify-start")}>
            {reactionGroups.map((r) => (
              <button
                key={r.emoji}
                onClick={() => onReact(r.emoji)}
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[11px] transition-colors",
                  r.userReacted
                    ? "border-[#FF4D15]/30 bg-[#FF4D15]/10 text-[#FF4D15]"
                    : "border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:border-[#FF4D15]/30"
                )}
              >
                <span>{r.emoji}</span>
                <span className="text-[10px] font-medium">{r.count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <p
          className={cn(
            "mt-1 text-[9px] text-gray-400 dark:text-zinc-500 px-1",
            isOwn ? "text-right" : "text-left"
          )}
        >
          {formatMessageTime(message.createdAt)}
        </p>

        {/* ── Hover actions bar ── */}
        {hovered && (
          <div
            className={cn(
              "absolute -top-8 z-10 flex items-center gap-0.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-1 py-0.5 shadow-lg",
              isOwn ? "right-0" : "left-0"
            )}
          >
            {/* Reply */}
            <button
              onClick={onReply}
              className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-zinc-500 dark:hover:bg-zinc-700 dark:hover:text-zinc-300 transition-colors"
              title="Reply"
            >
              <Reply className="h-3.5 w-3.5" />
            </button>

            {/* Thread */}
            <button
              onClick={onThreadOpen}
              className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-zinc-500 dark:hover:bg-zinc-700 dark:hover:text-zinc-300 transition-colors"
              title="Open thread"
            >
              <MessageSquare className="h-3.5 w-3.5" />
            </button>

            {/* Quick emojis */}
            {showEmojiBar ? (
              <div className="flex items-center gap-0.5">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onReact(emoji);
                      setShowEmojiBar(false);
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded text-sm hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            ) : (
              <button
                onClick={() => setShowEmojiBar(true)}
                className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-zinc-500 dark:hover:bg-zinc-700 dark:hover:text-zinc-300 transition-colors"
                title="React"
              >
                <SmilePlus className="h-3.5 w-3.5" />
              </button>
            )}

            {/* More dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-zinc-500 dark:hover:bg-zinc-700 dark:hover:text-zinc-300 transition-colors"
                title="More"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
              {showDropdown && (
                <div
                  className={cn(
                    "absolute top-7 z-20 w-36 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 py-1 shadow-xl",
                    isOwn ? "right-0" : "left-0"
                  )}
                >
                  <button
                    onClick={() => {
                      onForward();
                      setShowDropdown(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors"
                  >
                    <Forward className="h-3.5 w-3.5" />
                    Forward
                  </button>
                  {isOwn && (
                    <>
                      <button
                        onClick={() => {
                          onEdit();
                          setShowDropdown(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          onDelete();
                          setShowDropdown(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
