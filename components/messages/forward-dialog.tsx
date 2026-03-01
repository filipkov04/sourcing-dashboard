"use client";

import { useState, useCallback } from "react";
import { X, Search, Forward, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConversations, type Conversation, type Message } from "@/lib/use-conversations";
import { forwardMessage } from "@/lib/use-forward";

interface ForwardDialogProps {
  message: Message;
  onClose: () => void;
  onForwarded: () => void;
}

export function ForwardDialog({ message, onClose, onForwarded }: ForwardDialogProps) {
  const [search, setSearch] = useState("");
  const { conversations, loading } = useConversations(search || undefined);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [forwarding, setForwarding] = useState(false);

  // Filter out current conversation
  const filteredConversations = conversations.filter(
    (c) => c.id !== message.conversationId
  );

  function toggleSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const handleForward = useCallback(async () => {
    if (selectedIds.size === 0 || forwarding) return;
    setForwarding(true);
    try {
      await forwardMessage(message.id, Array.from(selectedIds));
      onForwarded();
      onClose();
    } catch (err) {
      console.error("Forward failed:", err);
    } finally {
      setForwarding(false);
    }
  }, [selectedIds, forwarding, message.id, onForwarded, onClose]);

  function getConversationName(conv: Conversation): string {
    if (conv.type === "DIRECT") {
      const otherParticipant = conv.participants.find(
        (p) => p.userId !== message.senderId
      );
      return otherParticipant?.user.name || conv.subject || "Direct Message";
    }
    return conv.subject || conv.factory?.name || "Untitled";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Forward className="h-4 w-4 text-[#F97316]" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Forward Message
            </h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Message preview */}
        <div className="border-b border-gray-100 px-5 py-3 dark:border-zinc-800">
          <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-zinc-800">
            <p className="text-[11px] font-medium text-gray-500 dark:text-zinc-400 mb-1">
              {message.sender?.name || "You"}
            </p>
            <p className="text-sm text-gray-700 dark:text-zinc-300 line-clamp-3">
              {message.content}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-100 dark:border-zinc-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-300 dark:text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-[#FF8C1A] focus:outline-none focus:ring-1 focus:ring-[#FF8C1A]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-400 transition-colors"
              autoFocus
            />
          </div>
        </div>

        {/* Conversation list */}
        <div className="max-h-[300px] overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400 dark:text-zinc-500">
              No conversations found
            </p>
          ) : (
            filteredConversations.map((conv) => {
              const selected = selectedIds.has(conv.id);
              return (
                <button
                  key={conv.id}
                  onClick={() => toggleSelection(conv.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150",
                    selected
                      ? "bg-[#F97316]/10 dark:bg-[#F97316]/10"
                      : "hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                  )}
                >
                  {/* Checkbox */}
                  <div
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                      selected
                        ? "border-[#F97316] bg-[#F97316]"
                        : "border-gray-300 dark:border-zinc-600"
                    )}
                  >
                    {selected && <Check className="h-3 w-3 text-white" />}
                  </div>

                  {/* Name */}
                  <span className="flex-1 truncate text-sm font-medium text-gray-700 dark:text-zinc-300">
                    {getConversationName(conv)}
                  </span>

                  {/* Type badge */}
                  <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {conv.type}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 dark:border-zinc-800">
          <span className="text-xs text-gray-400 dark:text-zinc-500">
            {selectedIds.size} selected
          </span>
          <button
            onClick={handleForward}
            disabled={selectedIds.size === 0 || forwarding}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
              selectedIds.size > 0 && !forwarding
                ? "bg-gradient-to-br from-[#F97316] to-[#d44a1a] text-white shadow-sm shadow-[#FF8C1A]/20 hover:shadow-md"
                : "bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-zinc-500 cursor-not-allowed"
            )}
          >
            {forwarding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Forward className="h-4 w-4" />
            )}
            Forward
          </button>
        </div>
      </div>
    </div>
  );
}
