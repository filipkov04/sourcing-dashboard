"use client";

import { Search, Package, Factory, MessageSquare, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SourcyAvatar } from "./sourcy-avatar";
import type { Conversation } from "@/lib/use-conversations";

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
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

interface ConversationListPanelProps {
  conversations: Conversation[];
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (id: string) => void;
  onNewSupport: () => void;
  onNewFactory: () => void;
  onNewGeneral: () => void;
  onClose: () => void;
}

export function ConversationListPanel({
  conversations,
  loading,
  search,
  onSearchChange,
  onSelect,
  onNewSupport,
  onClose,
}: ConversationListPanelProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-b from-[#FFA53A] via-[#FF8C1A] to-[#F97316] px-4 py-3.5">
        <h2 className="text-base font-semibold text-white tracking-tight">Messages</h2>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2.5 border-b border-gray-100 dark:border-zinc-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-300 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-[#FF8C1A] focus:outline-none focus:ring-1 focus:ring-[#FF8C1A]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-400 transition-colors"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-0.5 p-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl p-3">
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-zinc-800" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3.5 w-3/5 rounded-full bg-gray-100 dark:bg-zinc-800" />
                    <div className="h-3 w-4/5 rounded-full bg-gray-50 dark:bg-zinc-800/50" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 dark:bg-zinc-800/50 mb-3">
              <MessageSquare className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-zinc-400">
              {search ? "No conversations found" : "No conversations yet"}
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500">
              {search ? "Try a different search term" : "Start chatting with support or your factories"}
            </p>
            {!search && (
              <button
                onClick={onNewSupport}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-b from-[#FFA53A] via-[#FF8C1A] to-[#F97316] px-4 py-2 text-xs font-medium text-white hover:brightness-90 transition-colors shadow-sm shadow-[#FF8C1A]/20"
              >
                <MessageSquare className="h-3 w-3" />
                Start a support chat
              </button>
            )}
          </div>
        ) : (
          <div className="p-1.5 space-y-0.5">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={cn(
                  "flex w-full gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150",
                  "hover:bg-gray-50 dark:hover:bg-zinc-800/50",
                  "active:scale-[0.99]",
                  conv.unreadCount > 0 && "bg-[#FF8C1A]/[0.03] dark:bg-[#FF8C1A]/[0.03]"
                )}
              >
                {/* Avatar */}
                {conv.type === "SUPPORT" ? (
                  <div className="relative mt-0.5">
                    <SourcyAvatar size="lg" />
                    {conv.unreadCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-b from-[#FFA53A] via-[#FF8C1A] to-[#F97316] px-1 text-[8px] font-bold text-white ring-2 ring-white dark:ring-zinc-900">
                        {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-900 dark:bg-zinc-700">
                    {conv.type === "FACTORY" || conv.factory ? (
                      <Factory className="h-3.5 w-3.5 text-white" />
                    ) : conv.order ? (
                      <Package className="h-3.5 w-3.5 text-white" />
                    ) : (
                      <span className="text-[10px] font-bold text-white">{getInitials(conv.subject)}</span>
                    )}
                    {conv.unreadCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-b from-[#FFA53A] via-[#FF8C1A] to-[#F97316] px-1 text-[8px] font-bold text-white ring-2 ring-white dark:ring-zinc-900">
                        {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                      </span>
                    )}
                  </div>
                )}

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn(
                      "truncate text-[13px]",
                      conv.unreadCount > 0
                        ? "font-semibold text-gray-900 dark:text-white"
                        : "font-medium text-gray-700 dark:text-zinc-300"
                    )}>
                      {conv.subject || "Untitled"}
                    </p>
                    <span className="shrink-0 text-[10px] tabular-nums text-gray-400 dark:text-zinc-500">
                      {formatTimestamp(conv.lastMessageAt)}
                    </span>
                  </div>
                  {conv.lastMessage && (
                    <p className={cn(
                      "mt-0.5 truncate text-xs leading-relaxed",
                      conv.unreadCount > 0
                        ? "text-gray-600 dark:text-zinc-400"
                        : "text-gray-400 dark:text-zinc-500"
                    )}>
                      {conv.lastMessage.sender?.name ? (
                        <span className="font-medium">{conv.lastMessage.sender.name}: </span>
                      ) : conv.lastMessage.messageType === "BOT" ? (
                        <span className="font-medium text-[#F97316]/80">Sourcy: </span>
                      ) : null}
                      {conv.lastMessage.content}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
