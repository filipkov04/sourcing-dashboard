"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { X, User, Pencil, Calendar, Clock, Package, MessageSquare, Check, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useProfilePanel } from "@/lib/profile-panel-context";
import { useProfileStats } from "@/lib/use-profile-stats";
import { UserAvatar, AvatarPicker } from "@/components/avatar-picker";
import { cn } from "@/lib/utils";

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Unknown";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

function roleBadgeColor(role: string): string {
  switch (role) {
    case "OWNER":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300";
    case "ADMIN":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300";
  }
}

export function ProfilePanel() {
  const { isOpen, close } = useProfilePanel();
  const { data: session, update: updateSession } = useSession();
  const { stats, loading: statsLoading, refresh: refreshStats } = useProfileStats();

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [savingName, setSavingName] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [localAvatarId, setLocalAvatarId] = useState<string | null | undefined>(undefined);
  const avatarId = localAvatarId !== undefined ? localAvatarId : session?.user?.avatarId ?? null;

  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "";
  const userRole = session?.user?.role || "MEMBER";
  const orgName = session?.user?.organizationName || "";

  // Refresh stats when panel opens
  useEffect(() => {
    if (isOpen) {
      refreshStats();
    }
  }, [isOpen, refreshStats]);

  // Escape key closes panel
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);

  // Focus input when editing starts
  useEffect(() => {
    if (editingName) {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }
  }, [editingName]);

  const startEditName = useCallback(() => {
    setNameValue(userName);
    setEditingName(true);
  }, [userName]);

  const saveName = useCallback(async () => {
    const trimmed = nameValue.trim();
    if (!trimmed || trimmed === userName) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) {
        await updateSession();
      }
    } finally {
      setSavingName(false);
      setEditingName(false);
    }
  }, [nameValue, userName, updateSession]);

  const handleNameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        saveName();
      }
      if (e.key === "Escape") {
        setEditingName(false);
      }
    },
    [saveName]
  );

  const handleAvatarSelect = async (newAvatarId: string | null) => {
    setLocalAvatarId(newAvatarId);
    await updateSession();
  };

  if (!isOpen) return null;

  const statItems = [
    {
      icon: Calendar,
      label: "Joined",
      value: formatDate(stats?.joinDate ?? null),
    },
    {
      icon: Clock,
      label: "Last Active",
      value: formatRelativeTime(stats?.lastActive ?? null),
    },
    {
      icon: Package,
      label: "Orders",
      value: stats?.orderCount?.toString() ?? "0",
    },
    {
      icon: MessageSquare,
      label: "Messages Sent",
      value: stats?.messagesSent?.toString() ?? "0",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={close} />

      {/* Modal */}
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-[#FF4D15]" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Profile</h3>
          </div>
          <button
            onClick={close}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Large Avatar */}
          <div className="flex flex-col items-center gap-3">
            <UserAvatar avatarId={avatarId} initials={getInitials(userName)} size="lg" className="!h-20 !w-20 !text-2xl" />
          </div>

          {/* Avatar Picker */}
          <AvatarPicker currentAvatarId={avatarId} onSelect={handleAvatarSelect} />

          {/* Divider */}
          <div className="border-t border-gray-100 dark:border-zinc-800" />

          {/* Name (editable) */}
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                Name
              </label>
              {editingName ? (
                <div className="mt-1 flex items-center gap-2">
                  <input
                    ref={nameInputRef}
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    onKeyDown={handleNameKeyDown}
                    onBlur={saveName}
                    maxLength={100}
                    disabled={savingName}
                    className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-900 focus:border-[#FF4D15] focus:outline-none focus:ring-1 focus:ring-[#FF4D15]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white transition-colors"
                  />
                  {savingName ? (
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  ) : (
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault();
                        saveName();
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="mt-1 flex items-center gap-2 group">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{userName}</p>
                  <button
                    onClick={startEditName}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-gray-300 opacity-0 group-hover:opacity-100 hover:bg-gray-100 hover:text-gray-500 dark:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-400 transition-all"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                Email
              </label>
              <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">{userEmail}</p>
            </div>

            {/* Role */}
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                Role
              </label>
              <div className="mt-1">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                    roleBadgeColor(userRole)
                  )}
                >
                  {userRole.charAt(0) + userRole.slice(1).toLowerCase()}
                </span>
              </div>
            </div>

            {/* Organization */}
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                Organization
              </label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">{orgName}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 dark:border-zinc-800" />

          {/* Activity Stats */}
          <div>
            <label className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-zinc-500">
              Activity
            </label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {statItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <item.icon className="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                    <span className="text-[11px] text-gray-400 dark:text-zinc-500">{item.label}</span>
                  </div>
                  {statsLoading ? (
                    <div className="h-5 w-16 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
                  ) : (
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
