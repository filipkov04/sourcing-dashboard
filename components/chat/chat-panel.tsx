"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, Package, Factory, Loader2, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useConversationDetail, sendMessage, type Message } from "@/lib/use-conversations";
import { SourcyAvatar } from "./sourcy-avatar";
import { ChatDropZone } from "./chat-drop-zone";
import { MessageAttachments } from "./message-attachment";

function formatMessageTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

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

function formatHeaderDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" }) +
    " at " +
    date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function shouldShowDateSeparator(messages: Message[], index: number): boolean {
  if (index === 0) return true;
  return new Date(messages[index - 1].createdAt).toDateString() !== new Date(messages[index].createdAt).toDateString();
}

interface ChatPanelProps {
  conversationId: string;
  onBack: () => void;
  onMessageSent?: () => void;
}

export function ChatPanel({ conversationId, onBack, onMessageSent }: ChatPanelProps) {
  const { data: session } = useSession();
  const { conversation, loading, refresh } = useConversationDetail(conversationId);
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages.length]);

  useEffect(() => {
    if (conversationId) inputRef.current?.focus();
  }, [conversationId]);

  async function handleSend() {
    if ((!input.trim() && files.length === 0) || sending) return;
    const content = input.trim();
    const filesToSend = [...files];
    setInput("");
    setFiles([]);
    setSending(true);
    try {
      await sendMessage(conversationId, content, filesToSend.length > 0 ? filesToSend : undefined);
      await refresh();
      onMessageSent?.();
    } catch {
      setInput(content);
      setFiles(filesToSend);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#f8f9fa] dark:bg-zinc-950">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-[#EB5D2E]" />
          <p className="text-[10px] text-gray-400 dark:text-zinc-500">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (!conversation) return null;

  const currentUserId = session?.user?.id;
  const isSupport = conversation.type === "SUPPORT";
  const isFactory = conversation.type === "FACTORY";

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
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20">
          {isSupport ? (
            <Headphones className="h-3.5 w-3.5 text-white" />
          ) : isFactory || conversation.factory ? (
            <Factory className="h-3.5 w-3.5 text-white" />
          ) : conversation.order ? (
            <Package className="h-3.5 w-3.5 text-white" />
          ) : (
            <span className="text-[10px] font-bold text-white">
              {getInitials(conversation.subject)}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {isSupport ? "Sourcy Agent" : conversation.subject || "Untitled"}
          </p>
          <p className="truncate text-[10px] text-white/70">
            {isSupport
              ? "Support chat"
              : isFactory && conversation.factory
                ? conversation.factory.name
                : `Started ${formatHeaderDate(conversation.createdAt)}`}
          </p>
        </div>
        {isSupport && (
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[9px] font-medium text-white/70">Online</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-0.5 bg-[#f8f9fa] dark:bg-zinc-950">
        {conversation.messages.map((msg, i) => {
          const isOwn = msg.senderId === currentUserId;
          const isSystem = msg.messageType === "SYSTEM";
          const isBot = msg.messageType === "BOT";
          const showDate = shouldShowDateSeparator(conversation.messages, i);

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="flex items-center gap-3 py-3">
                  <div className="flex-1 border-t border-gray-200/80 dark:border-zinc-800" />
                  <span className="text-[10px] font-medium text-gray-400 dark:text-zinc-500 bg-[#f8f9fa] dark:bg-zinc-950 px-1">
                    {formatDateSeparator(msg.createdAt)}
                  </span>
                  <div className="flex-1 border-t border-gray-200/80 dark:border-zinc-800" />
                </div>
              )}

              {isSystem ? (
                <div className="flex justify-center py-1.5">
                  <span className="rounded-full bg-gray-100 dark:bg-zinc-800/80 px-3 py-1 text-[10px] text-gray-500 dark:text-zinc-400">
                    {msg.content}
                  </span>
                </div>
              ) : isBot ? (
                <div className="flex gap-2 py-1.5 flex-row">
                  <div className="relative mt-0.5 shrink-0 h-6 w-6">
                    <SourcyAvatar size="sm" />
                    <div className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 ring-[1.5px] ring-[#f8f9fa] dark:ring-zinc-950" />
                  </div>
                  <div className="max-w-[80%]">
                    <p className="mb-0.5 text-[10px] font-semibold text-[#EB5D2E] ml-1">
                      Sourcy Agent
                    </p>
                    <div className="rounded-2xl rounded-bl-md px-3 py-2.5 text-[13px] leading-relaxed bg-white dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 shadow-sm border border-gray-100 dark:border-zinc-700/50">
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>
                    <p className="mt-1 text-[9px] text-gray-400 dark:text-zinc-500 px-1 text-left">
                      {formatMessageTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className={cn("flex gap-2 py-1.5", isOwn ? "flex-row-reverse" : "flex-row")}>
                  {!isOwn && (
                    <div className="relative mt-0.5 shrink-0 h-6 w-6">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-800 dark:bg-zinc-700">
                        <span className="text-[8px] font-bold text-white">
                          {getInitials(msg.sender?.name)}
                        </span>
                      </div>
                      <div className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-green-500 ring-[1.5px] ring-[#f8f9fa] dark:ring-zinc-950" />
                    </div>
                  )}

                  <div className={cn("max-w-[80%]", isOwn ? "items-end" : "items-start")}>
                    {!isOwn && (
                      <p className="mb-0.5 text-[10px] font-medium text-gray-500 dark:text-zinc-400 ml-1">
                        {msg.sender?.name || msg.sender?.email || "Unknown"}
                      </p>
                    )}
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
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <ChatDropZone files={files} onFilesChange={setFiles}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-[13px] text-gray-900 placeholder-gray-400 focus:border-[#EB5D2E] focus:outline-none focus:ring-2 focus:ring-[#EB5D2E]/10 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-400 transition-all"
            style={{ maxHeight: "80px" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 80) + "px";
            }}
          />
          <button
            onClick={handleSend}
            disabled={(!input.trim() && files.length === 0) || sending}
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200",
              (input.trim() || files.length > 0) && !sending
                ? "bg-gradient-to-br from-[#EB5D2E] to-[#d44a1a] text-white shadow-sm shadow-[#EB5D2E]/20 hover:shadow-md hover:shadow-[#EB5D2E]/30 hover:scale-105"
                : "bg-gray-100 text-gray-400 dark:bg-zinc-800 dark:text-zinc-500"
            )}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </ChatDropZone>
      </div>
    </div>
  );
}
