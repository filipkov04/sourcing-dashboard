"use client";

import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Loader2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MessageBubble } from "./message-bubble";
import { DateSeparator } from "./date-separator";
import { TypingIndicator } from "./typing-indicator";
import type { Message } from "@/lib/use-conversations";

/* ─── Helpers ─── */

/** Check if two dates fall on different calendar days. */
function isDifferentDay(a: string, b: string): boolean {
  return new Date(a).toDateString() !== new Date(b).toDateString();
}

/**
 * Build a flat list of render items: either a message or a date separator.
 * Date separators are inserted whenever two consecutive messages fall on different days.
 */
type RenderItem =
  | { type: "date"; date: Date; key: string }
  | { type: "message"; message: Message; showSender: boolean; key: string };

function buildRenderItems(messages: Message[], currentUserId: string): RenderItem[] {
  const items: RenderItem[] = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const prev = messages[i - 1];

    // Insert date separator if first message or day changed
    if (!prev || isDifferentDay(prev.createdAt, msg.createdAt)) {
      const date = new Date(msg.createdAt);
      items.push({ type: "date", date, key: `date-${date.toDateString()}` });
    }

    // Show sender name when: other person's message AND (first message OR different sender from previous)
    const isOwn = msg.senderId === currentUserId;
    const showSender =
      !isOwn &&
      msg.messageType !== "SYSTEM" &&
      msg.messageType !== "BOT" &&
      (!prev || prev.senderId !== msg.senderId || isDifferentDay(prev.createdAt, msg.createdAt));

    items.push({ type: "message", message: msg, showSender, key: msg.id });
  }
  return items;
}

/* ─── Props ─── */

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  typingNames: string[];
  loading?: boolean;
  onReply: (message: Message) => void;
  onEdit: (message: Message) => void;
  onDelete: (messageId: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  onThreadOpen: (message: Message) => void;
  onForward: (message: Message) => void;
  onImageClick: (url: string) => void;
}

/* ─── Component ─── */

export function MessageList({
  messages,
  currentUserId,
  typingNames,
  loading = false,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onThreadOpen,
  onForward,
  onImageClick,
}: MessageListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [showNewMessagesPill, setShowNewMessagesPill] = useState(false);
  const prevMessageCountRef = useRef(messages.length);
  const isNearBottomRef = useRef(true);

  const renderItems = useMemo(() => buildRenderItems(messages, currentUserId), [messages, currentUserId]);

  const virtualizer = useVirtualizer({
    count: renderItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const item = renderItems[index];
      return item?.type === "date" ? 40 : 80;
    },
    overscan: 10,
  });

  /** Check if the user is scrolled near the bottom (within 100px). */
  const checkNearBottom = useCallback(() => {
    const el = parentRef.current;
    if (!el) return true;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    return distanceFromBottom < 100;
  }, []);

  /** Scroll to the bottom of the list. */
  const scrollToBottom = useCallback(
    (behavior: "smooth" | "auto" = "auto") => {
      if (renderItems.length > 0) {
        virtualizer.scrollToIndex(renderItems.length - 1, { align: "end", behavior });
      }
    },
    [virtualizer, renderItems.length]
  );

  // Track scroll position
  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;

    function handleScroll() {
      const nearBottom = checkNearBottom();
      isNearBottomRef.current = nearBottom;
      if (nearBottom) setShowNewMessagesPill(false);
    }

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [checkNearBottom]);

  // Auto-scroll on new message when near bottom, else show pill
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      if (isNearBottomRef.current) {
        // Small timeout to let virtualizer measure
        requestAnimationFrame(() => scrollToBottom("auto"));
      } else {
        setShowNewMessagesPill(true);
      }
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length, scrollToBottom]);

  // Initial scroll to bottom
  useEffect(() => {
    if (renderItems.length > 0) {
      requestAnimationFrame(() => scrollToBottom("auto"));
    }
    // Only on mount / conversation change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400 dark:text-zinc-500" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-gray-500 dark:text-zinc-400">No messages yet</p>
        <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500">
          Send a message to start the conversation
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full overflow-hidden">
      {/* Scrollable virtualised container */}
      <div ref={parentRef} className="h-full overflow-y-auto px-4">
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const item = renderItems[virtualRow.index];
            if (!item) return null;

            return (
              <div
                key={item.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {item.type === "date" ? (
                  <DateSeparator date={item.date} />
                ) : (
                  <MessageBubble
                    message={item.message}
                    isOwn={item.message.senderId === currentUserId}
                    currentUserId={currentUserId}
                    showSender={item.showSender}
                    onReply={() => onReply(item.message)}
                    onEdit={() => onEdit(item.message)}
                    onDelete={() => onDelete(item.message.id)}
                    onReact={(emoji) => onReact(item.message.id, emoji)}
                    onThreadOpen={() => onThreadOpen(item.message)}
                    onForward={() => onForward(item.message)}
                    onImageClick={onImageClick}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Typing indicator */}
      {typingNames.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white dark:from-zinc-900 to-transparent pt-4">
          <TypingIndicator names={typingNames} />
        </div>
      )}

      {/* "New messages" pill */}
      {showNewMessagesPill && (
        <button
          onClick={() => {
            scrollToBottom("auto");
            setShowNewMessagesPill(false);
          }}
          className={cn(
            "absolute bottom-4 left-1/2 -translate-x-1/2 z-10",
            "inline-flex items-center gap-1.5 rounded-full",
            "bg-gradient-to-br from-[#FF0F0F] to-[#FFB21A] px-4 py-1.5",
            "text-xs font-medium text-white shadow-lg shadow-[#FF4D15]/20",
            "hover:shadow-xl hover:scale-105 transition-all duration-200",
            "animate-in slide-in-from-bottom-2 fade-in duration-200"
          )}
        >
          <ChevronDown className="h-3.5 w-3.5" />
          New messages
        </button>
      )}
    </div>
  );
}
