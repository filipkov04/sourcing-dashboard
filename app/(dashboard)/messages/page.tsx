"use client";

import { useState, useCallback, useMemo } from "react";
import { useConversationDetail } from "@/lib/use-conversations";
import { MessagesSidebar } from "@/components/messages/messages-sidebar";
import { MessagesThread } from "@/components/messages/messages-thread";
import { MessagesEmptyState } from "@/components/messages/messages-empty-state";
import { ThreadPanel } from "@/components/messages/thread-panel";
import { useSession } from "next-auth/react";
import { usePresence } from "@/lib/use-presence";

export default function MessagesPage() {
  const { data: session } = useSession();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");

  const currentUserId = session?.user?.id ?? "";

  // Fetch conversation detail for thread panel
  const { conversation } = useConversationDetail(selectedConversationId);

  // Presence for thread panel
  const otherParticipantIds = useMemo(
    () =>
      (conversation?.participants ?? [])
        .map((p) => p.userId)
        .filter((uid) => uid !== currentUserId),
    [conversation?.participants, currentUserId]
  );
  const { statusMap } = usePresence(otherParticipantIds);

  // Find the parent message for the thread panel
  const parentMessage = useMemo(
    () => conversation?.messages.find((m) => m.id === activeThreadId) ?? null,
    [conversation?.messages, activeThreadId]
  );

  const handleSelect = useCallback((id: string) => {
    setSelectedConversationId(id);
    setActiveThreadId(null);
    setMobileView("thread");
  }, []);

  const handleConversationCreated = useCallback((id: string) => {
    setSelectedConversationId(id);
    setActiveThreadId(null);
    setMobileView("thread");
  }, []);

  const handleOpenThread = useCallback((messageId: string) => {
    setActiveThreadId(messageId);
  }, []);

  const handleCloseThread = useCallback(() => {
    setActiveThreadId(null);
  }, []);

  const handleConversationDeleted = useCallback(() => {
    setSelectedConversationId(null);
    setActiveThreadId(null);
    setMobileView("list");
  }, []);

  const handleBackToList = useCallback(() => {
    setMobileView("list");
  }, []);

  return (
    <div className="h-full flex">
      {/* Sidebar — conversation index (280px) */}
      <div
        className={`w-[280px] shrink-0 ${
          mobileView === "list" ? "flex" : "hidden"
        } lg:flex`}
      >
        <MessagesSidebar
          selectedId={selectedConversationId}
          onSelect={handleSelect}
          onConversationCreated={handleConversationCreated}
          onConversationDeleted={handleConversationDeleted}
        />
      </div>

      {/* Main thread (flex-1) */}
      <div
        className={`flex-1 min-w-0 ${
          mobileView === "thread" ? "flex" : "hidden"
        } lg:flex flex-col`}
      >
        {/* Mobile back button */}
        {mobileView === "thread" && (
          <button
            onClick={handleBackToList}
            className="mb-2 flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors lg:hidden"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to conversations
          </button>
        )}

        {selectedConversationId ? (
          <MessagesThread
            conversationId={selectedConversationId}
            onMessageSent={() => {}}
            onOpenThread={handleOpenThread}
            activeThreadId={activeThreadId}
          />
        ) : (
          <MessagesEmptyState />
        )}
      </div>

      {/* Thread panel (400px, conditional) */}
      {parentMessage && selectedConversationId && conversation && (
        <div className="hidden lg:flex">
          <ThreadPanel
            conversationId={selectedConversationId}
            parentMessage={parentMessage}
            currentUserId={currentUserId}
            participantCount={conversation.participants.length}
            statusMap={statusMap}
            onClose={handleCloseThread}
            onRefresh={() => {}}
          />
        </div>
      )}
    </div>
  );
}
