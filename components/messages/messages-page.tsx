"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  useConversations,
  useConversationDetail,
  sendMessage,
  editMessage,
  deleteMessage,
  toggleReaction,
  type Message,
  type ConversationDetail,
} from "@/lib/use-conversations";
import { usePresence, type PresenceStatus } from "@/lib/use-presence";
import { ConversationSidebar } from "./conversation-sidebar";
import { ChatHeader } from "./chat-header";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { ThreadPanel } from "./thread-panel";
import { ConversationSearchBar, GlobalSearchPanel } from "./search-panel";
import { ForwardDialog } from "./forward-dialog";
import { NewDMDialog } from "./new-dm-dialog";
import { MediaLightbox } from "./media-lightbox";
import { VoiceRecorderUI } from "./voice-recorder-ui";

type RightPanel = "none" | "thread" | "search";

export function MessagesPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const currentUserId = session?.user?.id || "";

  // Core state
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [rightPanel, setRightPanel] = useState<RightPanel>("none");
  const [threadMessage, setThreadMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [showNewDM, setShowNewDM] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxFileName, setLightboxFileName] = useState<string | undefined>();
  const [showConversationSearch, setShowConversationSearch] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [mobileView, setMobileView] = useState<"sidebar" | "chat">("sidebar");

  // Typing state
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [typingNames, setTypingNames] = useState<string[]>([]);

  // Data hooks
  const { conversations, loading: convsLoading, refresh: refreshConversations } = useConversations(sidebarSearch || undefined);
  const { conversation, loading: chatLoading, refresh: refreshChat } = useConversationDetail(selectedConversationId);

  // Presence for sidebar participants
  const participantUserIds = useMemo(() => {
    const ids = new Set<string>();
    conversations.forEach((c) => {
      c.participants.forEach((p) => {
        if (p.userId !== currentUserId) ids.add(p.userId);
      });
    });
    return Array.from(ids);
  }, [conversations, currentUserId]);

  const { statusMap: presenceMap } = usePresence(participantUserIds);

  // Get presence for current conversation's other participant
  const otherParticipantPresence: PresenceStatus = useMemo(() => {
    if (!conversation) return "offline";
    const other = conversation.participants.find((p) => p.userId !== currentUserId);
    if (!other) return "offline";
    return presenceMap[other.userId] || "offline";
  }, [conversation, currentUserId, presenceMap]);

  // Deep link: read ?cid= on mount
  useEffect(() => {
    const cid = searchParams.get("cid");
    if (cid) {
      setSelectedConversationId(cid);
      setMobileView("chat");
    }
  }, [searchParams]);

  // Poll typing status when in active chat
  useEffect(() => {
    if (!selectedConversationId) {
      setTypingNames([]);
      return;
    }
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch(`/api/conversations/${selectedConversationId}/typing`);
        if (res.ok && !cancelled) {
          const json = await res.json();
          setTypingNames(json.data.typing.map((t: { name: string | null }) => t.name || "Someone"));
        }
      } catch { /* ignore */ }
    }
    poll();
    const interval = setInterval(poll, 2000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [selectedConversationId]);

  // Report typing
  const reportTyping = useCallback(() => {
    if (!selectedConversationId || typingTimeoutRef.current) return;
    fetch(`/api/conversations/${selectedConversationId}/typing`, { method: "POST" }).catch(() => {});
    typingTimeoutRef.current = setTimeout(() => { typingTimeoutRef.current = null; }, 2000);
  }, [selectedConversationId]);

  // Keyboard handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (lightboxUrl) setLightboxUrl(null);
        else if (forwardingMessage) setForwardingMessage(null);
        else if (showNewDM) setShowNewDM(false);
        else if (rightPanel !== "none") {
          setRightPanel("none");
          setThreadMessage(null);
        }
        else if (showConversationSearch) setShowConversationSearch(false);
        else if (showGlobalSearch) setShowGlobalSearch(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxUrl, forwardingMessage, showNewDM, rightPanel, showConversationSearch, showGlobalSearch]);

  // ─── Handlers ───

  const handleSelectConversation = useCallback((id: string) => {
    setSelectedConversationId(id);
    setRightPanel("none");
    setThreadMessage(null);
    setEditingMessage(null);
    setShowConversationSearch(false);
    setShowVoiceRecorder(false);
    setMobileView("chat");
  }, []);

  const handleSendMessage = useCallback(async (content: string, files: File[]) => {
    if (!selectedConversationId) return;
    try {
      await sendMessage(selectedConversationId, content, files.length > 0 ? files : undefined);
      await refreshChat();
      refreshConversations();
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  }, [selectedConversationId, refreshChat, refreshConversations]);

  const handleEditSave = useCallback(async (content: string) => {
    if (!selectedConversationId || !editingMessage) return;
    try {
      await editMessage(selectedConversationId, editingMessage.id, content);
      setEditingMessage(null);
      await refreshChat();
    } catch (err) {
      console.error("Failed to edit message:", err);
    }
  }, [selectedConversationId, editingMessage, refreshChat]);

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    if (!selectedConversationId) return;
    if (!window.confirm("Delete this message?")) return;
    try {
      await deleteMessage(selectedConversationId, messageId);
      await refreshChat();
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  }, [selectedConversationId, refreshChat]);

  const handleReact = useCallback(async (messageId: string, emoji: string) => {
    if (!selectedConversationId) return;
    try {
      await toggleReaction(selectedConversationId, messageId, emoji);
      await refreshChat();
    } catch (err) {
      console.error("Failed to toggle reaction:", err);
    }
  }, [selectedConversationId, refreshChat]);

  const handleThreadOpen = useCallback((message: Message) => {
    setThreadMessage(message);
    setRightPanel("thread");
    setShowGlobalSearch(false);
  }, []);

  const handleReplyInThread = useCallback((message: Message) => {
    handleThreadOpen(message);
  }, [handleThreadOpen]);

  const handleForward = useCallback((message: Message) => {
    setForwardingMessage(message);
  }, []);

  const handleImageClick = useCallback((url: string, fileName?: string) => {
    setLightboxUrl(url);
    setLightboxFileName(fileName);
  }, []);

  const handleNewDMCreated = useCallback((conv: ConversationDetail) => {
    setSelectedConversationId(conv.id);
    setMobileView("chat");
    refreshConversations();
  }, [refreshConversations]);

  const handleSearchNavigate = useCallback((_messageId: string) => {
    // Scroll to message in list — the message list can handle this via a ref
    // For now just close search after navigating
  }, []);

  const handleGlobalSearchResult = useCallback((conversationId: string, _messageId: string) => {
    setSelectedConversationId(conversationId);
    setShowGlobalSearch(false);
    setMobileView("chat");
  }, []);

  const handleVoiceSend = useCallback(async (file: File) => {
    if (!selectedConversationId) return;
    setShowVoiceRecorder(false);
    try {
      await sendMessage(selectedConversationId, "", [file]);
      await refreshChat();
      refreshConversations();
    } catch (err) {
      console.error("Failed to send voice message:", err);
    }
  }, [selectedConversationId, refreshChat, refreshConversations]);


  // ─── Render ───

  const messages = conversation?.messages ?? [];

  return (
    <div className="flex h-full overflow-hidden">
      {/* LEFT: Conversation Sidebar */}
      <div
        className={cn(
          "h-full w-[320px] shrink-0 border-r border-gray-200 dark:border-zinc-800",
          "max-md:absolute max-md:inset-0 max-md:z-20 max-md:w-full",
          mobileView !== "sidebar" && "max-md:hidden"
        )}
      >
        <ConversationSidebar
          conversations={conversations}
          loading={convsLoading}
          selectedId={selectedConversationId}
          onSelect={handleSelectConversation}
          onNewDM={() => setShowNewDM(true)}
          presenceMap={presenceMap}
          currentUserId={currentUserId}
        />
      </div>

      {/* CENTER: Chat Panel */}
      <div
        className={cn(
          "flex h-full flex-1 flex-col min-w-0",
          "max-md:absolute max-md:inset-0 max-md:z-20",
          mobileView !== "chat" && "max-md:hidden"
        )}
      >
        {selectedConversationId && conversation ? (
          <>
            {/* Chat Header */}
            <ChatHeader
              conversation={conversation}
              currentUserId={currentUserId}
              presenceStatus={otherParticipantPresence}
              onSearchToggle={() => setShowConversationSearch((p) => !p)}
              onSettingsClick={() => {}}
              onBack={() => setMobileView("sidebar")}
            />

            {/* In-conversation search bar */}
            {showConversationSearch && (
              <ConversationSearchBar
                conversationId={selectedConversationId}
                onNavigate={handleSearchNavigate}
                onClose={() => setShowConversationSearch(false)}
              />
            )}

            {/* Messages */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <MessageList
                messages={messages}
                currentUserId={currentUserId}
                typingNames={typingNames}
                onReply={handleReplyInThread}
                onEdit={setEditingMessage}
                onDelete={handleDeleteMessage}
                onReact={handleReact}
                onThreadOpen={handleThreadOpen}
                onForward={handleForward}
                onImageClick={(url) => handleImageClick(url)}
              />
            </div>

            {/* Voice recorder or Message input */}
            <div className="shrink-0 border-t border-gray-100 dark:border-zinc-800">
              {showVoiceRecorder ? (
                <div className="p-3">
                  <VoiceRecorderUI
                    onSend={handleVoiceSend}
                    onCancel={() => setShowVoiceRecorder(false)}
                  />
                </div>
              ) : (
                <MessageInput
                  onSend={handleSendMessage}
                  onTyping={reportTyping}
                  onVoiceRecord={() => setShowVoiceRecorder(true)}
                  editingMessage={editingMessage}
                  onEditCancel={() => setEditingMessage(null)}
                  onEditSave={handleEditSave}
                />
              )}
            </div>
          </>
        ) : (
          /* Empty state — no conversation selected */
          <div className="flex h-full flex-col items-center justify-center px-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 dark:bg-zinc-800/50 mb-4">
              <svg className="h-8 w-8 text-gray-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              Your messages
            </h3>
            <p className="text-sm text-gray-500 dark:text-zinc-400 text-center max-w-[300px]">
              Select a conversation from the sidebar or start a new direct message.
            </p>
            <button
              onClick={() => setShowNewDM(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#FF0F0F] to-[#FFB21A] px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-[#FF4D15]/20 hover:shadow-md transition-shadow"
            >
              New message
            </button>
          </div>
        )}
      </div>

      {/* RIGHT: Thread or Search panel */}
      {rightPanel === "thread" && threadMessage && selectedConversationId && (
        <div className="h-full shrink-0 max-md:absolute max-md:right-0 max-md:top-0 max-md:z-30 max-md:w-full md:w-auto">
          <ThreadPanel
            conversationId={selectedConversationId}
            parentMessage={threadMessage}
            currentUserId={currentUserId}
            onClose={() => {
              setRightPanel("none");
              setThreadMessage(null);
            }}
          />
        </div>
      )}

      {showGlobalSearch && (
        <div className="h-full shrink-0 max-md:absolute max-md:right-0 max-md:top-0 max-md:z-30 max-md:w-full md:w-auto">
          <GlobalSearchPanel
            onSelectResult={handleGlobalSearchResult}
            onClose={() => setShowGlobalSearch(false)}
          />
        </div>
      )}

      {/* Overlays */}
      {forwardingMessage && (
        <ForwardDialog
          message={forwardingMessage}
          onClose={() => setForwardingMessage(null)}
          onForwarded={() => {
            refreshConversations();
          }}
        />
      )}

      {showNewDM && (
        <NewDMDialog
          currentUserId={currentUserId}
          onCreated={handleNewDMCreated}
          onClose={() => setShowNewDM(false)}
        />
      )}

      {lightboxUrl && (
        <MediaLightbox
          url={lightboxUrl}
          fileName={lightboxFileName}
          onClose={() => {
            setLightboxUrl(null);
            setLightboxFileName(undefined);
          }}
        />
      )}
    </div>
  );
}
