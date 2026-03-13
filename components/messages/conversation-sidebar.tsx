"use client";

import { useState } from "react";
import { Search, Plus, Factory, MessageSquare, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { SourcyAvatar } from "@/components/chat/sourcy-avatar";
import type { Conversation } from "@/lib/use-conversations";
import type { PresenceStatus } from "@/lib/use-presence";

/* ─── Helpers ─── */

function formatTimestamp(dateStr: string | null) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (isYesterday) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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

const presenceDotColor: Record<PresenceStatus, string> = {
  online: "bg-green-500",
  away: "bg-yellow-500",
  busy: "bg-red-500",
  offline: "bg-gray-400 dark:bg-zinc-500",
};

/* ─── Props ─── */

interface ConversationSidebarProps {
  conversations: Conversation[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewDM: () => void;
  presenceMap: Record<string, PresenceStatus>;
  currentUserId: string;
}

/* ─── Component ─── */

export function ConversationSidebar({
  conversations,
  loading,
  selectedId,
  onSelect,
  onNewDM,
  presenceMap,
  currentUserId,
}: ConversationSidebarProps) {
  const [search, setSearch] = useState("");

  // Filter conversations by search
  const filtered = conversations.filter((conv) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchesSubject = conv.subject?.toLowerCase().includes(q);
      const matchesFactory = conv.factory?.name.toLowerCase().includes(q);
      const matchesParticipant = conv.participants.some((p) =>
        p.user.name?.toLowerCase().includes(q)
      );
      let previewText = conv.lastMessage?.content || "";
      if (conv.lastMessage?.messageType === "REQUEST") {
        try { const p = JSON.parse(previewText); if (p._requestCard) previewText = p.text || ""; } catch {}
      }
      const matchesLastMessage = previewText.toLowerCase().includes(q);
      return matchesSubject || matchesFactory || matchesParticipant || matchesLastMessage;
    }
    return true;
  });

  // Separate pinned and unpinned
  const pinned = filtered.filter((c) => c.pinned);
  const unpinned = filtered.filter((c) => !c.pinned);

  /**
   * For DIRECT conversations, resolve the other participant's display name
   * instead of showing the subject line.
   */
  function getDisplayName(conv: Conversation): string {
    if (conv.type === "DIRECT") {
      const other = conv.participants.find((p) => p.userId !== currentUserId);
      return other?.user?.name || conv.subject || "Direct Message";
    }
    if (conv.type === "FACTORY" && conv.factory) return conv.factory.name;
    if (conv.type === "SUPPORT") return "Support Chat";
    return conv.subject || "Untitled";
  }

  /**
   * Renders a single conversation row.
   */
  function renderConversationItem(conv: Conversation) {
    const isSelected = conv.id === selectedId;
    const displayName = getDisplayName(conv);

    // For DIRECT: find other participant for avatar + presence
    const otherParticipant =
      conv.type === "DIRECT"
        ? conv.participants.find((p) => p.userId !== currentUserId)
        : null;
    const otherImage = otherParticipant?.user?.image || null;
    const otherUserId = otherParticipant?.userId;
    const presence = otherUserId ? presenceMap[otherUserId] : undefined;

    return (
      <button
        key={conv.id}
        onClick={() => onSelect(conv.id)}
        className={cn(
          "flex w-full gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150",
          "hover:bg-gray-50 dark:hover:bg-zinc-800/50",
          "active:scale-[0.99]",
          isSelected && "bg-[#FF4D15]/10 border-l-2 border-[#FF4D15] rounded-l-none",
          !isSelected && conv.unreadCount > 0 && "bg-[#FF4D15]/[0.03] dark:bg-[#FF4D15]/[0.03]"
        )}
      >
        {/* Avatar */}
        {conv.type === "SUPPORT" ? (
          <div className="relative mt-0.5 shrink-0">
            <SourcyAvatar size="lg" />
            {conv.unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-b from-[#FF0F0F] via-[#FF6B15] to-[#FFB21A] px-1 text-[8px] font-bold text-white ring-2 ring-white dark:ring-zinc-900">
                {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
              </span>
            )}
          </div>
        ) : conv.type === "FACTORY" ? (
          <div className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-900 dark:bg-zinc-700">
            <Factory className="h-3.5 w-3.5 text-white" />
            {conv.unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-b from-[#FF0F0F] via-[#FF6B15] to-[#FFB21A] px-1 text-[8px] font-bold text-white ring-2 ring-white dark:ring-zinc-900">
                {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
              </span>
            )}
          </div>
        ) : conv.type === "DIRECT" && otherImage ? (
          <div className="relative mt-0.5 shrink-0">
            <img
              src={otherImage}
              alt={displayName}
              className="h-9 w-9 rounded-full object-cover"
            />
            {presence && (
              <span
                className={cn(
                  "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-zinc-900",
                  presenceDotColor[presence]
                )}
              />
            )}
            {conv.unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-b from-[#FF0F0F] via-[#FF6B15] to-[#FFB21A] px-1 text-[8px] font-bold text-white ring-2 ring-white dark:ring-zinc-900">
                {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
              </span>
            )}
          </div>
        ) : (
          <div className="relative mt-0.5 shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 dark:bg-zinc-700">
              <span className="text-[10px] font-bold text-white">
                {getInitials(displayName)}
              </span>
            </div>
            {conv.type === "DIRECT" && presence && (
              <span
                className={cn(
                  "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-zinc-900",
                  presenceDotColor[presence]
                )}
              />
            )}
            {conv.unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-b from-[#FF0F0F] via-[#FF6B15] to-[#FFB21A] px-1 text-[8px] font-bold text-white ring-2 ring-white dark:ring-zinc-900">
                {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
              </span>
            )}
          </div>
        )}

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p
              className={cn(
                "truncate text-[13px]",
                conv.unreadCount > 0
                  ? "font-semibold text-gray-900 dark:text-white"
                  : "font-medium text-gray-700 dark:text-zinc-300"
              )}
            >
              {displayName}
            </p>
            <span className="shrink-0 text-[10px] tabular-nums text-gray-400 dark:text-zinc-500">
              {formatTimestamp(conv.lastMessageAt)}
            </span>
          </div>
          {conv.lastMessage && (
            <p
              className={cn(
                "mt-0.5 truncate text-xs leading-relaxed",
                conv.unreadCount > 0
                  ? "text-gray-600 dark:text-zinc-400"
                  : "text-gray-400 dark:text-zinc-500"
              )}
            >
              {conv.lastMessage.sender?.name ? (
                <span className="font-medium">{conv.lastMessage.sender.name}: </span>
              ) : conv.lastMessage.messageType === "BOT" ? (
                <span className="font-medium text-[#FF4D15]/80">Sourcy: </span>
              ) : null}
              {conv.lastMessage.messageType === "REQUEST" ? (() => {
                try {
                  const parsed = JSON.parse(conv.lastMessage.content);
                  if (parsed._requestCard) return parsed.text || "Shared a request";
                } catch {}
                return conv.lastMessage.content;
              })() : conv.lastMessage.content}
            </p>
          )}
        </div>
      </button>
    );
  }

  return (
    <div className="flex h-full w-80 shrink-0 flex-col border-r border-gray-200 dark:border-zinc-700/50 bg-white dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Messages</h2>
        <button
          onClick={onNewDM}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF0F0F] to-[#FFB21A] text-white shadow-sm shadow-[#FF4D15]/20 hover:shadow-md hover:scale-105 transition-all duration-200"
          title="New message"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-300 dark:text-zinc-500" />
          <input
            id="conversation-search"
            name="conversation-search"
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-[#FF4D15] focus:outline-none focus:ring-1 focus:ring-[#FF4D15]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-400 transition-colors"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          /* Loading skeletons */
          <div className="space-y-0.5 p-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl p-3">
                <div className="flex gap-3">
                  <div className="h-9 w-9 rounded-full bg-gray-100 dark:bg-zinc-800" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3.5 w-3/5 rounded-full bg-gray-100 dark:bg-zinc-800" />
                    <div className="h-3 w-4/5 rounded-full bg-gray-50 dark:bg-zinc-800/50" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 dark:bg-zinc-800/50 mb-3">
              <MessageSquare className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-zinc-400">
              {search ? "No conversations found" : "No conversations yet"}
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500">
              {search
                ? "Try a different search term"
                : "Start a new conversation to get going"}
            </p>
            {!search && (
              <button
                onClick={onNewDM}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-b from-[#FF0F0F] via-[#FF6B15] to-[#FFB21A] px-4 py-2 text-xs font-medium text-white hover:brightness-90 transition-colors shadow-sm shadow-[#FF4D15]/20"
              >
                <Plus className="h-3 w-3" />
                New message
              </button>
            )}
          </div>
        ) : (
          <div className="p-1.5">
            {/* Pinned conversations */}
            {pinned.length > 0 && (
              <>
                <div className="flex items-center gap-1.5 px-3 py-1.5">
                  <Pin className="h-3 w-3 text-gray-400 dark:text-zinc-500" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                    Pinned
                  </span>
                </div>
                <div className="space-y-0.5">
                  {pinned.map((conv) => renderConversationItem(conv))}
                </div>
                <div className="mx-3 my-1.5 h-px bg-gray-100 dark:bg-zinc-800" />
              </>
            )}

            {/* Regular conversations */}
            <div className="space-y-0.5">
              {unpinned.map((conv) => renderConversationItem(conv))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
