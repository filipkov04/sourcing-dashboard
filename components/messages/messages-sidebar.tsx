"use client";

import { useState } from "react";
import { Search, Plus, MessageSquare, Factory, Package, Pin, Trash2, CheckSquare, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useConversations, deleteConversation } from "@/lib/use-conversations";
import { usePresence } from "@/lib/use-presence";
import { SourcyAvatar } from "@/components/chat/sourcy-avatar";
import { StatusDot, getBestStatus } from "./status-dot";
import { NewConversationDialog } from "@/components/chat/new-conversation-dialog";
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

interface MessagesSidebarProps {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onConversationCreated: (id: string) => void;
  onConversationDeleted?: (id: string) => void;
}

export function MessagesSidebar({ selectedId, onSelect, onConversationCreated, onConversationDeleted }: MessagesSidebarProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id ?? "";
  const [search, setSearch] = useState("");
  const { conversations, loading, refresh } = useConversations(search || undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Multi-select mode
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);

  // Collect all participant user IDs for presence
  const allUserIds = Array.from(
    new Set(conversations.flatMap((c) => c.participants.map((p) => p.userId)))
  );
  const { statusMap } = usePresence(allUserIds);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  // Separate pinned and unpinned
  const pinned = conversations.filter((c) => c.pinned);
  const unpinned = conversations.filter((c) => !c.pinned);

  function handleCreated(id: string) {
    refresh();
    onConversationCreated(id);
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await deleteConversation(id);
      setDeleteConfirmId(null);
      if (selectedId === id) {
        onConversationDeleted?.(id);
      }
      refresh();
    } catch {
      // silently fail
    } finally {
      setDeleting(false);
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelected(new Set());
    setShowBulkConfirm(false);
  }

  function selectAll() {
    setSelected(new Set(conversations.map((c) => c.id)));
  }

  async function handleBulkDelete() {
    setBulkDeleting(true);
    try {
      await Promise.all(Array.from(selected).map((id) => deleteConversation(id)));
      if (selectedId && selected.has(selectedId)) {
        onConversationDeleted?.(selectedId);
      }
      refresh();
      exitSelectMode();
    } catch {
      // silently fail
    } finally {
      setBulkDeleting(false);
      setShowBulkConfirm(false);
    }
  }

  function renderConversation(conv: Conversation) {
    const isActive = conv.id === selectedId;
    const displayName = getDisplayName(conv);
    const preview = getPreviewText(conv);
    const otherIds = conv.participants
      .map((p) => p.userId)
      .filter((uid) => uid !== currentUserId);
    const convStatus = getBestStatus(otherIds, statusMap, conv.type === "SUPPORT");
    const isChecked = selected.has(conv.id);

    return (
      <div
        key={conv.id}
        role="button"
        tabIndex={0}
        onClick={() => selectMode ? toggleSelect(conv.id) : onSelect(conv.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            selectMode ? toggleSelect(conv.id) : onSelect(conv.id);
          }
        }}
        className={cn(
          "group/conv relative flex w-full gap-3 rounded-xl px-3 py-3 text-left transition-all duration-150 cursor-pointer",
          selectMode && isChecked
            ? "bg-red-50 dark:bg-red-950/20"
            : isActive
              ? "bg-[#FF8C1A]/5 dark:bg-[#FF8C1A]/10"
              : "hover:bg-gray-50 dark:hover:bg-zinc-800/50",
          "active:scale-[0.99]"
        )}
      >
        {isActive && !selectMode && (
          <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-gradient-to-b from-[#FFA53A] via-[#FF8C1A] to-[#F97316]" />
        )}

        {/* Checkbox in select mode, Avatar otherwise */}
        {selectMode ? (
          <div className="flex items-center justify-center mt-0.5 shrink-0 h-10 w-10">
            <div className={cn(
              "flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all",
              isChecked
                ? "border-red-500 bg-red-500"
                : "border-gray-300 dark:border-zinc-600"
            )}>
              {isChecked && (
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </div>
          </div>
        ) : (
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
            <StatusDot status={convStatus} size="md" />
            {conv.unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-gradient-to-b from-[#FFA53A] via-[#FF8C1A] to-[#F97316] px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-zinc-900">
                {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
              </span>
            )}
          </div>
        )}

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {conv.pinned && <Pin className="h-3 w-3 shrink-0 text-[#F97316]" />}
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
            <div className="flex items-center gap-1 shrink-0">
              {!selectMode && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirmId(conv.id);
                  }}
                  className="opacity-0 group-hover/conv:opacity-100 p-1 rounded-md text-gray-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 transition-all"
                  title="Delete conversation"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              <span className="text-[11px] tabular-nums text-gray-400 dark:text-zinc-500">
                {formatTimestamp(conv.lastMessageAt)}
              </span>
            </div>
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
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full w-full flex-col border-r border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Messages</h2>
            {totalUnread > 0 && !selectMode && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-b from-[#FFA53A] via-[#FF8C1A] to-[#F97316] px-1.5 text-[10px] font-bold text-white">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {selectMode ? (
              <>
                <button
                  onClick={selectAll}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  All
                </button>
                <button
                  onClick={exitSelectMode}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                  title="Cancel selection"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                {conversations.length > 0 && (
                  <button
                    onClick={() => setSelectMode(true)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Select conversations"
                  >
                    <CheckSquare className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => setDialogOpen(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-b from-[#FFA53A] via-[#FF8C1A] to-[#F97316] text-white shadow-sm shadow-[#FF8C1A]/20 transition-all hover:brightness-90 hover:shadow-md hover:scale-105 active:scale-95"
                  title="New conversation"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Bulk delete bar */}
        {selectMode && selected.size > 0 && (
          <div className="mx-4 mb-2 flex items-center justify-between rounded-xl bg-red-50 dark:bg-red-950/30 px-4 py-2.5 border border-red-200 dark:border-red-900/50">
            <span className="text-xs font-medium text-red-600 dark:text-red-400">
              {selected.size} selected
            </span>
            <button
              onClick={() => setShowBulkConfirm(true)}
              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          </div>
        )}

        {/* Search */}
        {!selectMode && (
          <div className="px-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300 dark:text-zinc-500" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-[#FF8C1A] focus:outline-none focus:ring-1 focus:ring-[#FF8C1A]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-400 transition-colors"
              />
            </div>
          </div>
        )}

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
          ) : conversations.length === 0 ? (
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
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-b from-[#FFA53A] via-[#FF8C1A] to-[#F97316] px-4 py-2 text-xs font-medium text-white hover:brightness-90 transition-colors shadow-sm shadow-[#FF8C1A]/20"
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

      {/* Single delete confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-800">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Delete conversation?
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
              This will permanently delete this conversation and all its messages. This action cannot be undone.
            </p>
            <div className="mt-5 flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                disabled={deleting}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk delete confirmation */}
      {showBulkConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-800">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Delete {selected.size} conversation{selected.size > 1 ? "s" : ""}?
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
              This will permanently delete {selected.size > 1 ? "these conversations" : "this conversation"} and all messages. This cannot be undone.
            </p>
            <div className="mt-5 flex gap-3 justify-end">
              <button
                onClick={() => setShowBulkConfirm(false)}
                disabled={bulkDeleting}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {bulkDeleting ? "Deleting..." : `Delete ${selected.size}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
