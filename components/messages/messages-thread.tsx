"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Loader2, Factory, Package, Search, Settings } from "lucide-react";
import { useSession } from "next-auth/react";
import {
  useConversationDetail,
  sendMessage,
  type Message,
} from "@/lib/use-conversations";
import { usePresence } from "@/lib/use-presence";
import { SourcyAvatar } from "@/components/chat/sourcy-avatar";
import { StatusDot, getBestStatus } from "./status-dot";
import { MessageItem } from "./message-item";
import { MessageComposer } from "./message-composer";
import { MessageSearch } from "./message-search";
import { ConversationSettingsDialog } from "./conversation-settings-dialog";
import { ConversationProfilePopup } from "./conversation-profile-popup";

function formatDateSeparator(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function shouldShowDateSeparator(messages: Message[], index: number): boolean {
  if (index === 0) return true;
  return (
    new Date(messages[index - 1].createdAt).toDateString() !==
    new Date(messages[index].createdAt).toDateString()
  );
}

/** Should we show avatar + name, or just stack under the previous message? */
function shouldShowHeader(messages: Message[], index: number): boolean {
  if (index === 0) return true;
  const prev = messages[index - 1];
  const curr = messages[index];
  if (prev.senderId !== curr.senderId) return true;
  if (prev.messageType !== curr.messageType) return true;
  // Collapse if within 5 minutes of same sender
  const timeDiff = new Date(curr.createdAt).getTime() - new Date(prev.createdAt).getTime();
  return timeDiff > 5 * 60 * 1000;
}

interface MessagesThreadProps {
  conversationId: string;
  onMessageSent?: () => void;
  onOpenThread: (messageId: string) => void;
  activeThreadId?: string | null;
}

export function MessagesThread({
  conversationId,
  onMessageSent,
  onOpenThread,
  activeThreadId,
}: MessagesThreadProps) {
  const { data: session } = useSession();
  const { conversation, loading, refresh } = useConversationDetail(conversationId);
  const [showSearch, setShowSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [typingNames, setTypingNames] = useState<string[]>([]);

  const currentUserId = session?.user?.id ?? "";

  // Presence for other participants
  const otherParticipantIds = (conversation?.participants ?? [])
    .map((p) => p.userId)
    .filter((uid) => uid !== currentUserId);
  const { statusMap } = usePresence(otherParticipantIds);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages.length]);

  // Poll typing status
  useEffect(() => {
    if (!conversationId) {
      setTypingNames([]);
      return;
    }
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch(`/api/conversations/${conversationId}/typing`);
        if (res.ok && !cancelled) {
          const json = await res.json();
          setTypingNames(json.data.typing.map((t: { name: string | null }) => t.name || "Someone"));
        }
      } catch { /* ignore */ }
    }
    poll();
    const interval = setInterval(poll, 2000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [conversationId]);

  // Report typing — debounced
  const reportTyping = useCallback(() => {
    if (!conversationId || typingTimeoutRef.current) return;
    fetch(`/api/conversations/${conversationId}/typing`, { method: "POST" }).catch(() => {});
    typingTimeoutRef.current = setTimeout(() => { typingTimeoutRef.current = null; }, 2000);
  }, [conversationId]);

  // Optimistic messages shown instantly before API responds
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);

  // Clear optimistic messages when conversation refreshes (real data arrived)
  useEffect(() => {
    if (optimisticMessages.length > 0 && conversation?.messages) {
      setOptimisticMessages([]);
    }
  }, [conversation?.messages]);

  const handleSend = useCallback(
    async (content: string, files?: File[]) => {
      // Show message instantly (optimistic)
      const tempId = `optimistic-${Date.now()}`;
      const optimistic: Message = {
        id: tempId,
        conversationId,
        senderId: currentUserId,
        content: content || (files?.length ? `Shared ${files.length} file${files.length > 1 ? "s" : ""}` : ""),
        messageType: "TEXT",
        requestAction: null,
        sender: { id: currentUserId, name: session?.user?.name ?? null },
        createdAt: new Date().toISOString(),
        editedAt: null,
      };
      setOptimisticMessages((prev) => [...prev, optimistic]);

      // Send in background, then sync
      sendMessage(conversationId, content, files)
        .then(() => refresh())
        .catch(() => {
          // Remove failed optimistic message
          setOptimisticMessages((prev) => prev.filter((m) => m.id !== tempId));
        });
      onMessageSent?.();
    },
    [conversationId, currentUserId, session?.user?.name, refresh, onMessageSent]
  );

  // Determine header info
  const isSupport = conversation?.type === "SUPPORT";
  const displayName = isSupport
    ? "Sourcy Support"
    : conversation?.subject || conversation?.factory?.name || conversation?.order?.orderNumber || "Untitled";

  const conversationStatus = getBestStatus(otherParticipantIds, statusMap, isSupport);
  const statusLabel =
    conversationStatus === "online" ? "Online"
    : conversationStatus === "busy" ? "On a call"
    : conversationStatus === "away" ? "Away"
    : null;

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-white dark:bg-zinc-900">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-[#F97316]" />
          <p className="text-xs text-gray-400 dark:text-zinc-500">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (!conversation) return null;

  const participantCount = conversation.participants.length;

  return (
    <div className="flex h-full flex-col bg-white dark:bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-gray-100 px-6 py-3 dark:border-zinc-800">
        <button
          onClick={() => setShowProfile(true)}
          className="flex items-center gap-3 min-w-0 flex-1 rounded-lg -ml-2 px-2 py-1 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors text-left"
        >
          <div className="relative shrink-0">
            {isSupport ? (
              <SourcyAvatar size="lg" className="h-9 w-9" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 dark:from-zinc-600 dark:to-zinc-800">
                {conversation.factory ? (
                  <Factory className="h-4 w-4 text-white" />
                ) : conversation.order ? (
                  <Package className="h-4 w-4 text-white" />
                ) : (
                  <span className="text-xs font-bold text-white">
                    {getInitials(displayName)}
                  </span>
                )}
              </div>
            )}
            <StatusDot status={getBestStatus(otherParticipantIds, statusMap, isSupport)} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
              {displayName}
            </p>
            <p className="truncate text-[11px] text-gray-400 dark:text-zinc-500">
              {participantCount} members{statusLabel && ` · ${statusLabel}`}
            </p>
          </div>
        </button>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            title="Search messages"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            title="Conversation settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search overlay (replaces messages when active) */}
      {showSearch ? (
        <MessageSearch
          conversationId={conversationId}
          onClose={() => setShowSearch(false)}
          onJumpTo={() => setShowSearch(false)}
        />
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto py-2">
            {[...conversation.messages, ...optimisticMessages].map((msg, i, allMsgs) => {
              const showDate = shouldShowDateSeparator(allMsgs, i);
              const showHeader = shouldShowHeader(allMsgs, i);
              const isOptimistic = msg.id.startsWith("optimistic-");

              return (
                <div key={msg.id} className={isOptimistic ? "opacity-60" : undefined}>
                  {showDate && (
                    <div className="flex items-center gap-3 px-5 py-3">
                      <div className="flex-1 border-t border-gray-200/80 dark:border-zinc-800" />
                      <span className="text-[10px] font-medium text-gray-400 dark:text-zinc-500 px-1">
                        {formatDateSeparator(msg.createdAt)}
                      </span>
                      <div className="flex-1 border-t border-gray-200/80 dark:border-zinc-800" />
                    </div>
                  )}

                  <MessageItem
                    message={msg}
                    currentUserId={currentUserId}
                    conversationId={conversationId}
                    participantCount={participantCount}
                    statusMap={statusMap}
                    onOpenThread={onOpenThread}
                    onRefresh={refresh}
                    showAvatar={showHeader}
                    showSenderName={showHeader}
                  />
                </div>
              );
            })}

            {/* Typing indicator */}
            {typingNames.length > 0 && (
              <div className="flex items-center gap-2.5 px-5 py-2">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-gray-400 dark:bg-zinc-500 animate-bounce [animation-delay:0ms]" />
                  <span className="h-2 w-2 rounded-full bg-gray-400 dark:bg-zinc-500 animate-bounce [animation-delay:150ms]" />
                  <span className="h-2 w-2 rounded-full bg-gray-400 dark:bg-zinc-500 animate-bounce [animation-delay:300ms]" />
                </div>
                <span className="text-xs text-gray-400 dark:text-zinc-500">
                  {typingNames.join(", ")} {typingNames.length === 1 ? "is" : "are"} typing
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Composer */}
          <MessageComposer
            onSend={handleSend}
            onTyping={reportTyping}
          />
        </>
      )}

      {/* Conversation settings dialog */}
      <ConversationSettingsDialog
        conversationId={conversationId}
        open={showSettings}
        onClose={() => setShowSettings(false)}
        onSettingsChanged={refresh}
        participants={conversation.participants}
      />

      {/* Profile popup */}
      {showProfile && conversation && (
        <ConversationProfilePopup
          conversation={conversation}
          onClose={() => setShowProfile(false)}
          statusMap={statusMap}
        />
      )}
    </div>
  );
}
