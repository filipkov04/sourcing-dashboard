"use client";

import { useState } from "react";
import { Search, Plus, MessageSquare, Factory, Package, Pin } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConversations } from "@/lib/use-conversations";
import { usePresence } from "@/lib/use-presence";
import { SourcyAvatar } from "@/components/chat/sourcy-avatar";
import { NewConversationDialog } from "@/components/chat/new-conversation-dialog";
import type { Conversation, ConversationType } from "@/lib/use-conversations";

type TabFilter = "ALL" | ConversationType;

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

function getDisplayName(conv: Conversation): string {
  if (conv.type === "SUPPORT") return "Sourcy Support";
  if (conv.subject) return conv.subject;
  if (conv.factory) return conv.factory.name;
  if (conv.order) return conv.order.orderNumber;
  return "Untitled";
}

function getPreviewText(conv: Conversation): string | null {
  if (!conv.lastMessage) return null;
  const prefix =
    conv.lastMessage.messageType === "BOT"
      ? "Sourcy: "
      : conv.lastMessage.sender?.name
        ? `${conv.lastMessage.sender.name}: `
        : "";
  return prefix + conv.lastMessage.content;
}

const TABS: { key: TabFilter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "GENERAL", label: "General" },
  { key: "FACTORY", label: "Factory" },
  { key: "SUPPORT", label: "Support" },
];

interface MessagesSidebarProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onConversationCreated: (id: string) => void;
}

export function MessagesSidebar({ selectedId, onSelect, onConversationCreated }: MessagesSidebarProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabFilter>("ALL");
  const { conversations, loading, refresh } = useConversations(search || undefined);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Collect all participant user IDs for presence
  const allUserIds = Array.from(
    new Set(conversations.flatMap((c) => c.participants.map((p) => p.userId)))
  );
  const { onlineMap } = usePresence(allUserIds);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  // Filter by tab
  const filtered = activeTab === "ALL"
    ? conversations
    : conversations.filter((c) => c.type === activeTab);

  // Separate pinned and unpinned
  const pinned = filtered.filter((c) => c.pinned);
  const unpinned = filtered.filter((c) => !c.pinned);

  function handleCreated(id: string) {
    refresh();
    onConversationCreated(id);
  }

  function renderConversation(conv: Conversation) {
    const isActive = conv.id === selectedId;
    const displayName = getDisplayName(conv);
    const preview = getPreviewText(conv);
    const firstOtherParticipant = conv.participants.find(
      (p) => p.userId !== conv.participants[0]?.userId
    );
    const isOnline =
      conv.type === "SUPPORT" ||
      (firstOtherParticipant && onlineMap[firstOtherParticipant.userId]);

    return (
      <button
        key={conv.id}
        onClick={() => onSelect(conv.id)}
        className={cn(
          "relative flex w-full gap-3 rounded-xl px-3 py-3 text-left transition-all duration-150",
          isActive
            ? "bg-[#EB5D2E]/5 dark:bg-[#EB5D2E]/10"
            : "hover:bg-gray-50 dark:hover:bg-zinc-800/50",
          "active:scale-[0.99]"
        )}
      >
        {isActive && (
          <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-[#EB5D2E]" />
        )}

        {/* Avatar */}
        <div className="relative mt-0.5 shrink-0">
          {conv.type === "SUPPORT" ? (
            <SourcyAvatar size="lg" className="h-10 w-10" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gray-700 to-gray-900 dark:from-zinc-600 dark:to-zinc-800">
              {conv.factory ? (
                <Factory className="h-4 w-4 text-white" />
              ) : conv.order ? (
                <Package className="h-4 w-4 text-white" />
              ) : (
                <span className="text-xs font-bold text-white">
                  {getInitials(displayName)}
                </span>
              )}
            </div>
          )}
          {isOnline && (
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 ring-2 ring-white dark:ring-zinc-900" />
          )}
          {conv.unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#EB5D2E] px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-zinc-900">
              {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {conv.pinned && <Pin className="h-3 w-3 shrink-0 text-[#EB5D2E]" />}
              <p
                className={cn(
                  "truncate text-sm",
                  conv.unreadCount > 0
                    ? "font-semibold text-gray-900 dark:text-white"
                    : "font-medium text-gray-700 dark:text-zinc-300"
                )}
              >
                {displayName}
              </p>
            </div>
            <span className="shrink-0 text-[11px] tabular-nums text-gray-400 dark:text-zinc-500">
              {formatTimestamp(conv.lastMessageAt)}
            </span>
          </div>
          {preview && (
            <p
              className={cn(
                "mt-0.5 truncate text-xs leading-relaxed",
                conv.unreadCount > 0
                  ? "text-gray-600 dark:text-zinc-400"
                  : "text-gray-400 dark:text-zinc-500"
              )}
            >
              {preview}
            </p>
          )}
        </div>
      </button>
    );
  }

  return (
    <>
      <div className="flex h-full w-full flex-col rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Messages</h2>
            {totalUnread > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EB5D2E] px-1.5 text-[10px] font-bold text-white">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EB5D2E] text-white shadow-sm shadow-[#EB5D2E]/20 transition-all hover:bg-[#d4532a] hover:shadow-md hover:scale-105 active:scale-95"
            title="New conversation"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-[#EB5D2E] focus:outline-none focus:ring-1 focus:ring-[#EB5D2E]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-400 transition-colors"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pb-3">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                activeTab === tab.key
                  ? "bg-[#EB5D2E]/10 text-[#EB5D2E]"
                  : "text-gray-500 hover:bg-gray-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {loading ? (
            <div className="space-y-1 px-1">
              {Array.from({ length: 5 }).map((_, i) => (
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
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 dark:bg-zinc-800/50 mb-3">
                <MessageSquare className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                {search ? "No conversations found" : "No conversations yet"}
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500">
                {search ? "Try a different search term" : "Start a new conversation"}
              </p>
              {!search && (
                <button
                  onClick={() => setDialogOpen(true)}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#EB5D2E] px-4 py-2 text-xs font-medium text-white hover:bg-[#d4532a] transition-colors shadow-sm shadow-[#EB5D2E]/20"
                >
                  <Plus className="h-3 w-3" />
                  New conversation
                </button>
              )}
            </div>
          ) : (
            <div>
              {/* Pinned section */}
              {pinned.length > 0 && (
                <div className="mb-2">
                  <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                    Pinned
                  </p>
                  <div className="space-y-0.5">
                    {pinned.map(renderConversation)}
                  </div>
                </div>
              )}

              {/* Recent / Unpinned */}
              {unpinned.length > 0 && (
                <div>
                  {pinned.length > 0 && (
                    <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                      Recent
                    </p>
                  )}
                  <div className="space-y-0.5">
                    {unpinned.map(renderConversation)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <NewConversationDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={handleCreated}
      />
    </>
  );
}
