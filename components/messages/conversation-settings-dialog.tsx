"use client";

import { useState, useEffect } from "react";
import { X, Bell, BellOff, Pin, MessageSquare, AtSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { getConversationSettings, updateConversationSettings } from "@/lib/use-conversations";

interface ConversationSettingsDialogProps {
  conversationId: string;
  open: boolean;
  onClose: () => void;
  onSettingsChanged: () => void;
  participants: Array<{
    userId: string;
    user: { id: string; name: string | null; email: string; image: string | null };
  }>;
}

export function ConversationSettingsDialog({
  conversationId,
  open,
  onClose,
  onSettingsChanged,
  participants,
}: ConversationSettingsDialogProps) {
  const [settings, setSettings] = useState({
    muted: false,
    pinned: false,
    notifyReplies: true,
    notifyMentions: true,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getConversationSettings(conversationId)
      .then(setSettings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, conversationId]);

  async function toggleSetting(key: keyof typeof settings) {
    const newValue = !settings[key];
    setSettings((prev) => ({ ...prev, [key]: newValue }));
    await updateConversationSettings(conversationId, { [key]: newValue });
    onSettingsChanged();
  }

  if (!open) return null;

  const toggleItems = [
    {
      key: "pinned" as const,
      icon: Pin,
      label: "Pin conversation",
      description: "Keep at the top of your list",
    },
    {
      key: "muted" as const,
      icon: settings.muted ? BellOff : Bell,
      label: settings.muted ? "Unmute conversation" : "Mute conversation",
      description: settings.muted ? "You won't receive notifications" : "Receive notifications for new messages",
    },
    {
      key: "notifyReplies" as const,
      icon: MessageSquare,
      label: "Thread reply notifications",
      description: "Get notified when someone replies in a thread you're in",
    },
    {
      key: "notifyMentions" as const,
      icon: AtSign,
      label: "Mention notifications",
      description: "Get notified when you're mentioned",
    },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900 mx-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-zinc-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Conversation Settings
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          {loading ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-zinc-800" />
              ))}
            </div>
          ) : (
            <>
              {/* Toggles */}
              <div className="space-y-1">
                {toggleItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => toggleSetting(item.key)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800"
                  >
                    <item.icon className={cn(
                      "h-4.5 w-4.5 shrink-0",
                      settings[item.key]
                        ? "text-[#EB5D2E]"
                        : "text-gray-400 dark:text-zinc-500"
                    )} />
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.label}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500">
                        {item.description}
                      </p>
                    </div>
                    {/* Toggle switch */}
                    <div
                      className={cn(
                        "relative h-6 w-11 rounded-full transition-colors",
                        settings[item.key]
                          ? "bg-[#EB5D2E]"
                          : "bg-gray-200 dark:bg-zinc-700"
                      )}
                    >
                      <div
                        className={cn(
                          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                          settings[item.key] ? "translate-x-5" : "translate-x-0.5"
                        )}
                      />
                    </div>
                  </button>
                ))}
              </div>

              {/* Participants */}
              <div className="mt-5 border-t border-gray-100 pt-4 dark:border-zinc-800">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                  Members ({participants.length})
                </h3>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {participants.map((p) => (
                    <div
                      key={p.userId}
                      className="flex items-center gap-3 rounded-lg px-3 py-2"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gray-700 to-gray-900 dark:from-zinc-600 dark:to-zinc-800">
                        <span className="text-[10px] font-bold text-white">
                          {(p.user.name || p.user.email)[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                          {p.user.name || p.user.email}
                        </p>
                        <p className="truncate text-xs text-gray-400 dark:text-zinc-500">
                          {p.user.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
