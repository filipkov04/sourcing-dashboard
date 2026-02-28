"use client";

import { useCallback, useEffect, useRef } from "react";
import { X, Loader2 } from "lucide-react";
import { useThreadReplies, sendReply, type Message } from "@/lib/use-conversations";
import type { PresenceStatus } from "@/lib/use-presence";
import { MessageItem } from "./message-item";
import { MessageComposer } from "./message-composer";

interface ThreadPanelProps {
  conversationId: string;
  parentMessage: Message;
  currentUserId: string;
  participantCount: number;
  statusMap: Record<string, PresenceStatus>;
  onClose: () => void;
  onRefresh: () => void;
}

export function ThreadPanel({
  conversationId,
  parentMessage,
  currentUserId,
  participantCount,
  statusMap,
  onClose,
  onRefresh,
}: ThreadPanelProps) {
  const { replies, loading, refresh } = useThreadReplies(conversationId, parentMessage.id);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new replies
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies.length]);

  const handleSend = useCallback(
    async (content: string, files?: File[]) => {
      await sendReply(conversationId, parentMessage.id, content, files);
      refresh();
      onRefresh();
    },
    [conversationId, parentMessage.id, refresh, onRefresh]
  );

  const handleRefreshAll = useCallback(() => {
    refresh();
    onRefresh();
  }, [refresh, onRefresh]);

  return (
    <div className="flex h-full w-[400px] shrink-0 flex-col border-l border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-zinc-800">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Thread</h3>
          <p className="text-[11px] text-gray-400 dark:text-zinc-500">
            {parentMessage.threadCount ?? replies.length}{" "}
            {(parentMessage.threadCount ?? replies.length) === 1 ? "reply" : "replies"}
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Parent message */}
      <div className="border-b border-gray-100 dark:border-zinc-800">
        <MessageItem
          message={parentMessage}
          currentUserId={currentUserId}
          conversationId={conversationId}
          participantCount={participantCount}
          statusMap={statusMap}
          onOpenThread={() => {}}
          onRefresh={handleRefreshAll}
        />
      </div>

      {/* Replies */}
      <div className="flex-1 overflow-y-auto py-2">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[#F97316]" />
          </div>
        ) : replies.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-gray-400 dark:text-zinc-500">
              No replies yet. Start the conversation!
            </p>
          </div>
        ) : (
          replies.map((reply) => (
            <MessageItem
              key={reply.id}
              message={reply}
              currentUserId={currentUserId}
              conversationId={conversationId}
              participantCount={participantCount}
              statusMap={statusMap}
              onOpenThread={() => {}}
              onRefresh={handleRefreshAll}
            />
          ))
        )}
        <div ref={scrollRef} />
      </div>

      {/* Reply composer */}
      <MessageComposer
        onSend={handleSend}
        placeholder="Reply..."
      />
    </div>
  );
}
