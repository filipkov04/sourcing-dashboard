"use client";

import { useState, useCallback, useEffect } from "react";
import { MessageSquare, X, Headphones, Factory, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useConversations,
  useMessageUnreadCount,
  createConversation,
} from "@/lib/use-conversations";
import { ConversationListPanel } from "./conversation-list-panel";
import { ChatPanel } from "./chat-panel";
import { CategoryPicker } from "./category-picker";
import { FactorySelector } from "./factory-selector";
import { NewConversationDialog } from "./new-conversation-dialog";

type ViewState =
  | { view: "list" }
  | { view: "category-picker"; chatType: "SUPPORT" | "FACTORY" }
  | { view: "factory-select"; category: string }
  | { view: "chat"; conversationId: string };

type Tab = "all" | "support" | "factory";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [viewState, setViewState] = useState<ViewState>({ view: "list" });
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  const { count: unreadCount, refresh: refreshBadge } = useMessageUnreadCount();
  const { conversations, loading, refresh: refreshList } = useConversations(search);

  // Listen for "open-chat" events from notification clicks
  useEffect(() => {
    function handleOpenChat(e: Event) {
      const { conversationId } = (e as CustomEvent).detail;
      setOpen(true);
      setViewState({ view: "chat", conversationId });
      refreshList();
      refreshBadge();
    }
    window.addEventListener("open-chat", handleOpenChat);
    return () => window.removeEventListener("open-chat", handleOpenChat);
  }, [refreshList, refreshBadge]);

  const filteredConversations = conversations.filter((conv) => {
    if (activeTab === "all") return true;
    if (activeTab === "support") return conv.type === "SUPPORT";
    if (activeTab === "factory") return conv.type === "FACTORY";
    return true;
  });

  const handleMessageSent = useCallback(() => {
    refreshList();
    refreshBadge();
  }, [refreshList, refreshBadge]);

  const handleSelect = useCallback(
    (id: string) => {
      setViewState({ view: "chat", conversationId: id });
      setTimeout(() => {
        refreshList();
        refreshBadge();
      }, 500);
    },
    [refreshList, refreshBadge]
  );

  const handleBack = useCallback(() => {
    setViewState({ view: "list" });
    refreshList();
  }, [refreshList]);

  const handleCreated = useCallback(
    (id: string) => {
      setViewState({ view: "chat", conversationId: id });
      refreshList();
      setDialogOpen(false);
    },
    [refreshList]
  );

  const handleSupportCategory = useCallback(
    async (category: string) => {
      setCreating(true);
      try {
        const conv = await createConversation({
          subject: "Support Chat",
          type: "SUPPORT",
          category,
        });
        setViewState({ view: "chat", conversationId: conv.id });
        refreshList();
      } catch (err) {
        console.error("Failed to create support chat:", err);
        setViewState({ view: "list" });
      } finally {
        setCreating(false);
      }
    },
    [refreshList]
  );

  const handleFactoryCategory = useCallback((category: string) => {
    setViewState({ view: "factory-select", category });
  }, []);

  const handleFactorySelected = useCallback(
    async (factoryId: string, factoryName: string) => {
      if (viewState.view !== "factory-select") return;
      setCreating(true);
      try {
        const conv = await createConversation({
          subject: `Factory: ${factoryName}`,
          type: "FACTORY",
          category: viewState.category,
          factoryId,
        });
        setViewState({ view: "chat", conversationId: conv.id });
        refreshList();
      } catch (err) {
        console.error("Failed to create factory chat:", err);
        setViewState({ view: "list" });
      } finally {
        setCreating(false);
      }
    },
    [viewState, refreshList]
  );

  const sidebarItems: { key: Tab; icon: React.ElementType; label: string }[] = [
    { key: "all", icon: MessageSquare, label: "All" },
    { key: "support", icon: Headphones, label: "Support" },
    { key: "factory", icon: Factory, label: "Factory" },
  ];

  function renderContent() {
    if (creating) {
      return (
        <div className="flex h-full items-center justify-center bg-white dark:bg-zinc-900">
          <div className="flex flex-col items-center gap-3">
            <div className="relative h-10 w-10">
              <div className="absolute inset-0 animate-ping rounded-full bg-[#EB5D2E]/20" />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#EB5D2E] to-[#d44a1a]">
                <MessageSquare className="h-4 w-4 text-white" />
              </div>
            </div>
            <p className="text-xs font-medium text-gray-500 dark:text-zinc-400">Setting up your chat...</p>
          </div>
        </div>
      );
    }

    switch (viewState.view) {
      case "chat":
        return (
          <ChatPanel
            conversationId={viewState.conversationId}
            onBack={handleBack}
            onMessageSent={handleMessageSent}
          />
        );
      case "category-picker":
        return (
          <CategoryPicker
            chatType={viewState.chatType}
            onSelect={
              viewState.chatType === "SUPPORT"
                ? handleSupportCategory
                : handleFactoryCategory
            }
            onBack={handleBack}
          />
        );
      case "factory-select":
        return (
          <FactorySelector
            onSelect={handleFactorySelected}
            onBack={() =>
              setViewState({ view: "category-picker", chatType: "FACTORY" })
            }
          />
        );
      case "list":
      default:
        return (
          <ConversationListPanel
            conversations={filteredConversations}
            loading={loading}
            search={search}
            onSearchChange={setSearch}
            onSelect={handleSelect}
            onNewSupport={() =>
              setViewState({ view: "category-picker", chatType: "SUPPORT" })
            }
            onNewFactory={() =>
              setViewState({ view: "category-picker", chatType: "FACTORY" })
            }
            onNewGeneral={() => setDialogOpen(true)}
            onClose={() => setOpen(false)}
          />
        );
    }
  }

  const showSidebar = viewState.view === "list";

  return (
    <>
      {/* Floating Chat Panel */}
      <div
        className={cn(
          "fixed bottom-20 right-5 z-50 flex overflow-hidden rounded-2xl border shadow-2xl transition-all duration-300 ease-out",
          "border-gray-200/80 bg-white dark:border-zinc-700/80 dark:bg-zinc-900",
          "shadow-[0_25px_60px_-12px_rgba(0,0,0,0.25)]",
          open
            ? "h-[540px] w-[420px] opacity-100 translate-y-0 scale-100"
            : "h-0 w-[420px] opacity-0 translate-y-4 scale-95 pointer-events-none"
        )}
      >
        {open && (
          <div className="flex h-full w-full">
            {/* Left icon sidebar */}
            {showSidebar && (
              <div className="flex w-[52px] shrink-0 flex-col items-center border-r border-gray-100 dark:border-zinc-800 bg-gray-50/80 dark:bg-zinc-950/80 backdrop-blur-sm pt-4 pb-3">
                <div className="flex flex-col items-center gap-0.5">
                  {sidebarItems.map(({ key, icon: Icon, label }) => {
                    const isActive = activeTab === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={cn(
                          "group relative flex w-10 flex-col items-center gap-0.5 rounded-lg py-1.5 transition-all duration-150",
                          isActive
                            ? "bg-[#EB5D2E] text-white shadow-sm shadow-[#EB5D2E]/25"
                            : "text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-600 dark:hover:text-zinc-300"
                        )}
                        title={label}
                      >
                        <Icon className="h-4 w-4" />
                        <span className={cn(
                          "text-[8px] font-semibold uppercase tracking-wider leading-none",
                          isActive ? "text-white/90" : "text-gray-400 dark:text-zinc-500 group-hover:text-gray-500 dark:group-hover:text-zinc-400"
                        )}>
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* New chat button */}
                <div className="mt-auto">
                  <button
                    onClick={() => {
                      if (activeTab === "support") {
                        setViewState({ view: "category-picker", chatType: "SUPPORT" });
                      } else if (activeTab === "factory") {
                        setViewState({ view: "category-picker", chatType: "FACTORY" });
                      } else {
                        setDialogOpen(true);
                      }
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EB5D2E]/10 text-[#EB5D2E] hover:bg-[#EB5D2E] hover:text-white hover:shadow-sm hover:shadow-[#EB5D2E]/25 transition-all duration-200"
                    title="New conversation"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Main content */}
            <div className="flex-1 min-w-0">
              {renderContent()}
            </div>
          </div>
        )}
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

      <NewConversationDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={handleCreated}
      />
    </>
  );
}
