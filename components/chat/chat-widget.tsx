"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  MessageSquare, X, Loader2, ChevronRight, Clock, ArrowLeft,
  Send, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import {
  useConversations,
  useConversationDetail,
  useMessageUnreadCount,
  createConversation,
  sendMessage,
  sendQuickReply,
  type Conversation,
} from "@/lib/use-conversations";
import { SUPPORT_CATEGORIES, getCategoryLabel, getAutoReply, SUPPORT_GREETING } from "@/lib/chat-constants";
import type { Message } from "@/lib/use-conversations";
import { SourcyAvatar } from "./sourcy-avatar";
import { GradientCore } from "./gradient-core";
import { MessageAttachments } from "./message-attachment";

type ViewState =
  | { view: "home" }
  | { view: "history" };

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

function formatMessageTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function ChatWidget() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [viewState, setViewState] = useState<ViewState>({ view: "home" });
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [sendingCategory, setSendingCategory] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { count: unreadCount, refresh: refreshBadge } = useMessageUnreadCount();
  const { conversations, refresh: refreshList } = useConversations();
  const { conversation, refresh: refreshChat } = useConversationDetail(activeConversationId);
  const [typingNames, setTypingNames] = useState<string[]>([]);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const supportConversations = conversations.filter((c) => c.type === "SUPPORT");
  const userName = session?.user?.name?.split(" ")[0] || "there";
  const currentUserId = session?.user?.id;

  // Auto-scroll when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages?.length ?? 0, optimisticMessages.length]);

  // Poll typing status every 2s when in an active chat
  useEffect(() => {
    if (!activeConversationId) {
      setTypingNames([]);
      return;
    }
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch(`/api/conversations/${activeConversationId}/typing`);
        if (res.ok && !cancelled) {
          const json = await res.json();
          setTypingNames(json.data.typing.map((t: { name: string | null }) => t.name || "Someone"));
        }
      } catch { /* ignore */ }
    }
    poll();
    const interval = setInterval(poll, 2000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [activeConversationId]);

  // Report typing — debounced, fires at most every 2s
  function reportTyping() {
    if (!activeConversationId || typingTimeoutRef.current) return;
    fetch(`/api/conversations/${activeConversationId}/typing`, { method: "POST" }).catch(() => {});
    typingTimeoutRef.current = setTimeout(() => { typingTimeoutRef.current = null; }, 2000);
  }

  // Handle category selection — show optimistic messages instantly, API in background
  const handleCategorySelect = useCallback(
    async (category: string) => {
      setSendingCategory(category);

      const now = new Date().toISOString();
      const catLabel = getCategoryLabel("SUPPORT", category);

      // Show messages instantly
      setOptimisticMessages([
        {
          id: "opt-greeting",
          conversationId: "",
          senderId: null,
          content: SUPPORT_GREETING,
          messageType: "BOT",
          requestAction: null,
          sender: null,
          createdAt: now,
          editedAt: null,
        },
        {
          id: "opt-user",
          conversationId: "",
          senderId: currentUserId || "",
          content: catLabel,
          messageType: "TEXT",
          requestAction: null,
          sender: { id: currentUserId || "", name: session?.user?.name || null },
          createdAt: now,
          editedAt: null,
        },
        {
          id: "opt-reply",
          conversationId: "",
          senderId: null,
          content: getAutoReply(category),
          messageType: "BOT",
          requestAction: null,
          sender: null,
          createdAt: now,
          editedAt: null,
        },
      ]);

      // API calls in background
      try {
        const conv = await createConversation({
          subject: "Support Chat",
          type: "SUPPORT",
        });
        await sendQuickReply(conv.id, category);
        setActiveConversationId(conv.id);
        setOptimisticMessages([]);
        refreshList();
        refreshBadge();
      } catch (err) {
        console.error("Failed to create support chat:", err);
        setOptimisticMessages([]);
      } finally {
        setSendingCategory(null);
      }
    },
    [refreshList, refreshBadge, currentUserId, session?.user?.name]
  );

  // Handle free-text send
  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    try {
      if (activeConversationId) {
        // Send to existing conversation
        await sendMessage(activeConversationId, text);
        await refreshChat();
      } else {
        // Create new conversation + send
        const conv = await createConversation({
          subject: "Support Chat",
          type: "SUPPORT",
        });
        await sendMessage(conv.id, text);
        setActiveConversationId(conv.id);
        refreshList();
      }
      refreshBadge();
    } catch {
      setInput(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Reset to home when widget closes
  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  // Open a past conversation inline
  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    setViewState({ view: "home" });
  }, []);

  // Listen for "open-chat" events
  useEffect(() => {
    function handleOpenChat(e: Event) {
      const { conversationId } = (e as CustomEvent).detail;
      setOpen(true);
      setActiveConversationId(conversationId);
      setViewState({ view: "home" });
      refreshList();
      refreshBadge();
    }
    window.addEventListener("open-chat", handleOpenChat);
    return () => window.removeEventListener("open-chat", handleOpenChat);
  }, [refreshList, refreshBadge]);

  // Whether we have an active chat with messages (real or optimistic)
  const hasActiveChat = optimisticMessages.length > 0 || (activeConversationId && conversation && conversation.messages.length > 0);
  const displayMessages = optimisticMessages.length > 0 ? optimisticMessages : (conversation?.messages ?? []);

  function renderContent() {
    if (viewState.view === "history") {
      return (
        <HistoryView
          conversations={supportConversations}
          onSelect={handleSelectConversation}
          onBack={() => setViewState({ view: "home" })}
        />
      );
    }

    // Unified home + chat view
    return (
      <div className="flex h-full flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-end px-4 pt-3 pb-1 shrink-0">
          <button
            onClick={handleClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Welcome header — always the same */}
          <div className="flex flex-col items-center px-6 pt-4 pb-6">
            <div className="mb-3">
              <GradientCore size="lg" />
            </div>
            <p className="text-base text-gray-500 dark:text-zinc-400">
              Hi {userName},
            </p>
            <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white text-center leading-tight">
              Welcome back! How can I help?
            </h2>
            <p className="mt-3 text-sm text-gray-400 dark:text-zinc-500 text-center leading-relaxed max-w-[280px]">
              I&apos;m here to help you tackle your problems. Choose from the prompts below or just tell me what you need!
            </p>
          </div>

          {/* Quick-reply buttons — only when no active chat */}
          {!hasActiveChat && (
            <>
              <div className="px-4 pb-4">
                <div className="flex flex-wrap gap-2 justify-center">
                  {SUPPORT_CATEGORIES.map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => handleCategorySelect(cat.key)}
                      disabled={sendingCategory !== null}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[13px] font-medium transition-all duration-150",
                        "border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800",
                        "text-gray-700 dark:text-zinc-200",
                        "hover:border-[#EB5D2E]/50 hover:bg-[#EB5D2E]/[0.04] hover:text-[#EB5D2E]",
                        "active:scale-[0.97]",
                        sendingCategory === cat.key && "border-[#EB5D2E]/50 bg-[#EB5D2E]/[0.06]",
                        sendingCategory !== null && sendingCategory !== cat.key && "opacity-40"
                      )}
                    >
                      {sendingCategory === cat.key ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#EB5D2E]" />
                      ) : (
                        <span className="text-sm">{cat.emoji}</span>
                      )}
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Previous conversations link */}
              {supportConversations.length > 0 && (
                <div className="px-4 pb-4">
                  <button
                    onClick={() => setViewState({ view: "history" })}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <Clock className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
                    <span className="flex-1 font-medium">Previous conversations</span>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-300 dark:text-zinc-600" />
                  </button>
                </div>
              )}
            </>
          )}

          {/* Messages — shown inline when active chat exists */}
          {hasActiveChat && (
            <div className="px-4 space-y-0.5">
              {displayMessages.map((msg) => {
                const isOwn = msg.senderId === currentUserId;
                const isSystem = msg.messageType === "SYSTEM";
                const isBot = msg.messageType === "BOT";

                if (isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center py-1.5">
                      <span className="rounded-full bg-gray-100 dark:bg-zinc-800/80 px-3 py-1 text-[10px] text-gray-500 dark:text-zinc-400">
                        {msg.content}
                      </span>
                    </div>
                  );
                }

                if (isBot) {
                  return (
                    <div key={msg.id} className="flex gap-2 py-1.5">
                      <div className="mt-0.5 shrink-0">
                        <SourcyAvatar size="sm" />
                      </div>
                      <div className="max-w-[80%]">
                        <div className="rounded-2xl rounded-bl-md px-3 py-2.5 text-[13px] leading-relaxed bg-white dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 shadow-sm border border-gray-100 dark:border-zinc-700/50">
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        </div>
                        <p className="mt-1 text-[9px] text-gray-400 dark:text-zinc-500 px-1">
                          {formatMessageTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className={cn("flex gap-2 py-1.5", isOwn ? "flex-row-reverse" : "flex-row")}>
                    <div className={cn("max-w-[80%]", isOwn ? "items-end" : "items-start")}>
                      <div
                        className={cn(
                          "rounded-2xl px-3 py-2.5 text-[13px] leading-relaxed",
                          isOwn
                            ? "bg-gradient-to-br from-[#EB5D2E] to-[#d44a1a] text-white rounded-br-md shadow-sm shadow-[#EB5D2E]/15"
                            : "bg-white dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 rounded-bl-md shadow-sm border border-gray-100 dark:border-zinc-700/50"
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <MessageAttachments attachments={msg.attachments} />
                        )}
                      </div>
                      <p className={cn(
                        "mt-1 text-[9px] text-gray-400 dark:text-zinc-500 px-1",
                        isOwn ? "text-right" : "text-left"
                      )}>
                        {formatMessageTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
              {/* Typing indicator */}
              {typingNames.length > 0 && (
                <div className="flex items-center gap-2 py-1.5 px-1">
                  <div className="flex gap-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-zinc-500 animate-bounce [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-zinc-500 animate-bounce [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-zinc-500 animate-bounce [animation-delay:300ms]" />
                  </div>
                  <span className="text-[11px] text-gray-400 dark:text-zinc-500">
                    {typingNames.join(", ")} {typingNames.length === 1 ? "is" : "are"} typing
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input at bottom — always visible */}
        <div className="border-t border-gray-100 dark:border-zinc-800 px-4 py-3 bg-white dark:bg-zinc-900 shrink-0">
          <div className="flex items-center gap-2">
            {!hasActiveChat ? (
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300 dark:text-zinc-500" />
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-[#EB5D2E] focus:outline-none focus:ring-1 focus:ring-[#EB5D2E]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-400 transition-colors"
                />
              </form>
            ) : (
              <>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => { setInput(e.target.value); reportTyping(); }}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#EB5D2E] focus:outline-none focus:ring-1 focus:ring-[#EB5D2E]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-400 transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200",
                    input.trim() && !sending
                      ? "bg-gradient-to-br from-[#EB5D2E] to-[#d44a1a] text-white shadow-sm shadow-[#EB5D2E]/20 hover:shadow-md hover:scale-105"
                      : "bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-zinc-500"
                  )}
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Floating Chat Panel */}
      <div
        className={cn(
          "fixed bottom-20 right-5 z-50 flex overflow-hidden rounded-2xl border shadow-2xl transition-all duration-300 ease-out",
          "border-gray-200/80 bg-white dark:border-zinc-700/80 dark:bg-zinc-900",
          "shadow-[0_25px_60px_-12px_rgba(0,0,0,0.25)]",
          open
            ? "h-[580px] w-[380px] opacity-100 translate-y-0 scale-100"
            : "h-0 w-[380px] opacity-0 translate-y-4 scale-95 pointer-events-none"
        )}
      >
        {open && renderContent()}
      </div>

      {/* FAB */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:scale-105 active:scale-95",
          "shadow-[0_8px_30px_-4px_rgba(0,0,0,0.2)]",
          open
            ? "bg-gray-900 dark:bg-zinc-700 rotate-0"
            : "bg-gradient-to-br from-[#EB5D2E] to-[#d44a1a] hover:shadow-[0_8px_30px_-4px_rgba(235,93,46,0.4)]"
        )}
      >
        {open ? (
          <X className="h-6 w-6 text-white transition-transform duration-200" />
        ) : (
          <>
            <MessageSquare className="h-6 w-6 text-white" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-zinc-950 animate-in fade-in">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </>
        )}
      </button>
    </>
  );
}

/* ─── History View (Previous Conversations) ─── */

function HistoryView({
  conversations,
  onSelect,
  onBack,
}: {
  conversations: Conversation[];
  onSelect: (id: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 bg-[#EB5D2E] px-3 py-3">
        <button
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h2 className="text-sm font-semibold text-white">Previous Conversations</h2>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <Clock className="h-8 w-8 text-gray-200 dark:text-zinc-700 mb-3" />
            <p className="text-sm text-gray-500 dark:text-zinc-400">No conversations yet</p>
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
                  conv.unreadCount > 0 && "bg-[#EB5D2E]/[0.03]"
                )}
              >
                <div className="relative mt-0.5">
                  <SourcyAvatar size="lg" />
                  {conv.unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#EB5D2E] px-1 text-[8px] font-bold text-white ring-2 ring-white dark:ring-zinc-900">
                      {conv.unreadCount > 9 ? "9+" : conv.unreadCount}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn(
                      "truncate text-[13px]",
                      conv.unreadCount > 0
                        ? "font-semibold text-gray-900 dark:text-white"
                        : "font-medium text-gray-700 dark:text-zinc-300"
                    )}>
                      {conv.subject || "Support Chat"}
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
                      {conv.lastMessage.messageType === "BOT" ? (
                        <span className="font-medium text-[#EB5D2E]/80">Sourcy: </span>
                      ) : conv.lastMessage.sender?.name ? (
                        <span className="font-medium">{conv.lastMessage.sender.name}: </span>
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
