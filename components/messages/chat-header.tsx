"use client";

import { ArrowLeft, Search, Settings, Factory, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { SourcyAvatar } from "@/components/chat/sourcy-avatar";
import type { Conversation, ConversationDetail } from "@/lib/use-conversations";
import type { PresenceStatus } from "@/lib/use-presence";

interface ChatHeaderProps {
  conversation: ConversationDetail | Conversation;
  currentUserId: string;
  presenceStatus: PresenceStatus;
  onSearchToggle: () => void;
  onSettingsClick: () => void;
  onBack: () => void;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const presenceLabel: Record<PresenceStatus, string> = {
  online: "Online",
  away: "Away",
  busy: "Busy",
  offline: "Offline",
};

const presenceDotColor: Record<PresenceStatus, string> = {
  online: "bg-green-500",
  away: "bg-yellow-500",
  busy: "bg-red-500",
  offline: "bg-gray-400 dark:bg-zinc-500",
};

export function ChatHeader({
  conversation,
  currentUserId,
  presenceStatus,
  onSearchToggle,
  onSettingsClick,
  onBack,
}: ChatHeaderProps) {
  const isDirect = conversation.type === "DIRECT";
  const isFactory = conversation.type === "FACTORY";
  const isSupport = conversation.type === "SUPPORT";

  // For DIRECT conversations, find the other participant
  const otherParticipant = isDirect
    ? conversation.participants.find((p) => p.userId !== currentUserId)
    : null;
  const otherName = otherParticipant?.user?.name || "Unknown";
  const otherImage = otherParticipant?.user?.image || null;

  // Display name and subtitle
  let displayName = conversation.subject || "Untitled";
  let subtitle: React.ReactNode = null;

  if (isDirect) {
    displayName = otherName;
    subtitle = (
      <div className="flex items-center gap-1.5">
        <span
          className={cn("h-1.5 w-1.5 rounded-full", presenceDotColor[presenceStatus])}
        />
        <span className="text-xs text-gray-500 dark:text-zinc-400">
          {presenceLabel[presenceStatus]}
        </span>
      </div>
    );
  } else if (isFactory && conversation.factory) {
    displayName = conversation.factory.name;
    if (conversation.factory.location) {
      subtitle = (
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-zinc-400">
          <MapPin className="h-3 w-3" />
          <span>{conversation.factory.location}</span>
        </div>
      );
    }
  } else if (isSupport) {
    displayName = "Support Chat";
  }

  return (
    <div className="flex h-16 shrink-0 items-center gap-3 border-b border-gray-200 dark:border-zinc-700/50 bg-white dark:bg-zinc-900 px-4">
      {/* Back button — mobile only */}
      <button
        onClick={onBack}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors md:hidden"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>

      {/* Avatar */}
      {isSupport ? (
        <SourcyAvatar size="lg" />
      ) : isFactory ? (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-900 dark:bg-zinc-700">
          <Factory className="h-4 w-4 text-white" />
        </div>
      ) : isDirect && otherImage ? (
        <div className="relative">
          <img
            src={otherImage}
            alt={otherName}
            className="h-9 w-9 rounded-full object-cover"
          />
          <span
            className={cn(
              "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-zinc-900",
              presenceDotColor[presenceStatus]
            )}
          />
        </div>
      ) : isDirect ? (
        <div className="relative">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 dark:bg-zinc-700">
            <span className="text-[11px] font-bold text-white">
              {getInitials(otherName)}
            </span>
          </div>
          <span
            className={cn(
              "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-zinc-900",
              presenceDotColor[presenceStatus]
            )}
          />
        </div>
      ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 dark:bg-zinc-700">
          <span className="text-[11px] font-bold text-white">
            {getInitials(displayName)}
          </span>
        </div>
      )}

      {/* Name + status */}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
          {displayName}
        </h3>
        {subtitle}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onSearchToggle}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors"
          title="Search messages"
        >
          <Search className="h-4 w-4" />
        </button>
        <button
          onClick={onSettingsClick}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors"
          title="Conversation settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
