"use client";

import { useState, useCallback } from "react";
import { MessageSquare, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message, MessageReaction } from "@/lib/use-conversations";
import { editMessage, deleteMessage, toggleReaction } from "@/lib/use-conversations";
import { SourcyAvatar } from "@/components/chat/sourcy-avatar";
import { MessageAttachments } from "@/components/chat/message-attachment";
import { MessageActions } from "./message-actions";

function formatMessageTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/** Group reactions by emoji, collect user IDs */
function groupReactions(reactions: MessageReaction[]) {
  const map = new Map<string, { emoji: string; userIds: string[]; count: number }>();
  for (const r of reactions) {
    const existing = map.get(r.emoji);
    if (existing) {
      existing.userIds.push(r.userId);
      existing.count++;
    } else {
      map.set(r.emoji, { emoji: r.emoji, userIds: [r.userId], count: 1 });
    }
  }
  return Array.from(map.values());
}

interface MessageItemProps {
  message: Message;
  currentUserId: string;
  conversationId: string;
  participantCount: number;
  onlineMap: Record<string, boolean>;
  onOpenThread: (messageId: string) => void;
  onRefresh: () => void;
  showAvatar?: boolean;
  showSenderName?: boolean;
}

export function MessageItem({
  message: msg,
  currentUserId,
  conversationId,
  participantCount,
  onlineMap,
  onOpenThread,
  onRefresh,
  showAvatar = true,
  showSenderName = true,
}: MessageItemProps) {
  const [hovered, setHovered] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(msg.content);

  const isOwn = msg.senderId === currentUserId;
  const isSystem = msg.messageType === "SYSTEM";
  const isBot = msg.messageType === "BOT";
  const isDeleted = !!msg.deletedAt;

  const reactions = groupReactions(msg.reactions ?? []);

  const handleReact = useCallback(
    async (emoji: string) => {
      await toggleReaction(conversationId, msg.id, emoji);
      onRefresh();
    },
    [conversationId, msg.id, onRefresh]
  );

  const handleEdit = useCallback(async () => {
    if (!editContent.trim()) return;
    await editMessage(conversationId, msg.id, editContent.trim());
    setEditing(false);
    onRefresh();
  }, [conversationId, msg.id, editContent, onRefresh]);

  const handleDelete = useCallback(async () => {
    await deleteMessage(conversationId, msg.id);
    onRefresh();
  }, [conversationId, msg.id, onRefresh]);

  // Read receipts
  function getReadStatus() {
    if (!msg.readBy || msg.senderId !== currentUserId) return null;
    const othersWhoRead = msg.readBy.filter((r) => r.userId !== currentUserId);
    if (othersWhoRead.length === 0) return null;
    if (participantCount === 2) return "read";
    return `Read by ${othersWhoRead.length}`;
  }

  // System message
  if (isSystem) {
    return (
      <div className="flex justify-center py-1.5">
        <span className="rounded-full bg-gray-100 px-4 py-1.5 text-[11px] text-gray-500 dark:bg-zinc-800/80 dark:text-zinc-400">
          {msg.content}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative flex gap-3 px-5 py-1.5 transition-colors",
        hovered && "bg-gray-50/80 dark:bg-zinc-800/30"
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar column */}
      <div className="w-9 shrink-0 pt-0.5">
        {showAvatar && (
          <div className="relative">
            {isBot ? (
              <SourcyAvatar size="sm" className="h-9 w-9" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 dark:from-zinc-600 dark:to-zinc-800">
                <span className="text-xs font-bold text-white">
                  {getInitials(msg.sender?.name)}
                </span>
              </div>
            )}
            {msg.sender?.id && onlineMap[msg.sender.id] && (
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white dark:ring-zinc-900" />
            )}
          </div>
        )}
      </div>

      {/* Content column */}
      <div className="min-w-0 flex-1">
        {/* Sender name + timestamp row */}
        {showSenderName && (
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {isBot ? "Sourcy Agent" : msg.sender?.name || msg.sender?.email || "Unknown"}
            </span>
            <span className="text-[11px] text-gray-400 dark:text-zinc-500">
              {formatMessageTime(msg.createdAt)}
            </span>
            {msg.editedAt && !isDeleted && (
              <span className="text-[10px] text-gray-400 dark:text-zinc-500">(edited)</span>
            )}
          </div>
        )}

        {/* Message content */}
        {isDeleted ? (
          <p className="text-sm italic text-gray-400 dark:text-zinc-500">
            This message was deleted
          </p>
        ) : editing ? (
          <div className="mt-1">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full rounded-lg border border-[#EB5D2E] bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#EB5D2E]/20 dark:bg-zinc-800 dark:text-white"
              rows={2}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleEdit();
                }
                if (e.key === "Escape") {
                  setEditing(false);
                  setEditContent(msg.content);
                }
              }}
            />
            <div className="mt-1 flex gap-2 text-xs">
              <button
                onClick={handleEdit}
                className="text-[#EB5D2E] hover:text-[#d4532a] font-medium"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setEditContent(msg.content);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
              >
                Cancel
              </button>
              <span className="text-gray-300 dark:text-zinc-600">
                Esc to cancel, Enter to save
              </span>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-gray-800 dark:text-zinc-200 whitespace-pre-wrap break-words">
              {msg.content}
            </p>
            {msg.attachments && msg.attachments.length > 0 && (
              <div className="mt-1.5">
                <MessageAttachments attachments={msg.attachments} />
              </div>
            )}
          </>
        )}

        {/* Reactions */}
        {reactions.length > 0 && !isDeleted && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {reactions.map((r) => {
              const hasReacted = r.userIds.includes(currentUserId);
              return (
                <button
                  key={r.emoji}
                  onClick={() => handleReact(r.emoji)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors",
                    hasReacted
                      ? "border-[#EB5D2E]/30 bg-[#EB5D2E]/10 text-[#EB5D2E]"
                      : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600"
                  )}
                >
                  <span>{r.emoji}</span>
                  <span className="font-medium">{r.count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Thread count / reply indicator */}
        {msg.threadCount && msg.threadCount > 0 && !isDeleted && (
          <button
            onClick={() => onOpenThread(msg.id)}
            className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-[#EB5D2E] hover:text-[#d4532a] transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {msg.threadCount} {msg.threadCount === 1 ? "reply" : "replies"}
          </button>
        )}

        {/* Read receipt */}
        {!showSenderName && isOwn && (
          <div className="mt-0.5">
            {(() => {
              const status = getReadStatus();
              if (status === "read") {
                return <CheckCheck className="h-3.5 w-3.5 text-blue-500" />;
              }
              if (status) {
                return <span className="text-[10px] text-blue-500">{status}</span>;
              }
              return null;
            })()}
          </div>
        )}
      </div>

      {/* Hover actions */}
      {hovered && !isDeleted && !isSystem && !editing && (
        <MessageActions
          isOwn={isOwn}
          onReply={() => onOpenThread(msg.id)}
          onReact={handleReact}
          onEdit={isOwn && msg.messageType === "TEXT" ? () => setEditing(true) : undefined}
          onDelete={isOwn ? handleDelete : undefined}
        />
      )}
    </div>
  );
}
