"use client";

import { useState, useCallback, useEffect } from "react";
import { X, Search, Loader2, MessageSquare, Check, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { createConversation, type ConversationDetail } from "@/lib/use-conversations";

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
}

interface NewDMDialogProps {
  currentUserId: string;
  onCreated: (conversation: ConversationDetail) => void;
  onClose: () => void;
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

export function NewDMDialog({ currentUserId, onCreated, onClose }: NewDMDialogProps) {
  const [search, setSearch] = useState("");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [groupName, setGroupName] = useState("");

  // Fetch team members
  useEffect(() => {
    async function fetchMembers() {
      try {
        const res = await fetch("/api/team");
        if (res.ok) {
          const json = await res.json();
          setMembers(
            (json.data || []).filter((m: TeamMember) => m.id !== currentUserId)
          );
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchMembers();
  }, [currentUserId]);

  const filteredMembers = search
    ? members.filter(
        (m) =>
          m.name?.toLowerCase().includes(search.toLowerCase()) ||
          m.email.toLowerCase().includes(search.toLowerCase())
      )
    : members;

  const isGroup = selected.size > 1;

  const toggleSelect = useCallback((memberId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  }, []);

  // Always toggle selection on click
  const handleMemberClick = useCallback(
    (member: TeamMember) => {
      if (creating) return;
      toggleSelect(member.id);
    },
    [creating, toggleSelect]
  );

  // Create DM with single selected person
  const handleCreateDM = useCallback(async () => {
    if (creating || selected.size !== 1) return;
    setCreating(true);
    const memberId = Array.from(selected)[0];
    const member = members.find((m) => m.id === memberId);
    try {
      const conv = await createConversation({
        subject: member?.name || member?.email || "",
        participantIds: [memberId],
        type: "DIRECT",
      });
      onCreated(conv);
      onClose();
    } catch (err) {
      console.error("Failed to create DM:", err);
    } finally {
      setCreating(false);
    }
  }, [creating, selected, members, onCreated, onClose]);

  // Create group conversation
  const handleCreateGroup = useCallback(async () => {
    if (creating || selected.size < 2) return;
    setCreating(true);

    const participantIds = Array.from(selected);
    const selectedMembers = members.filter((m) => selected.has(m.id));
    const defaultName = selectedMembers
      .map((m) => m.name?.split(" ")[0] || m.email.split("@")[0])
      .join(", ");

    try {
      const conv = await createConversation({
        subject: groupName.trim() || defaultName,
        participantIds,
        type: "GENERAL",
      });
      onCreated(conv);
      onClose();
    } catch (err) {
      console.error("Failed to create group:", err);
    } finally {
      setCreating(false);
    }
  }, [creating, selected, members, groupName, onCreated, onClose]);

  const selectedMembers = members.filter((m) => selected.has(m.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[#FF4D15]" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              New Message
            </h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-100 dark:border-zinc-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-300 dark:text-zinc-500" />
            <input
              type="text"
              id="dm-search"
              name="dm-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-[#FF4D15] focus:outline-none focus:ring-1 focus:ring-[#FF4D15]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-400 transition-colors"
              autoFocus
            />
          </div>
        </div>

        {/* Selected chips — show when 1+ selected */}
        {selected.size > 0 && (
          <div className="flex flex-wrap gap-1.5 px-5 py-2.5 border-b border-gray-100 dark:border-zinc-800">
            {selectedMembers.map((m) => (
              <button
                key={m.id}
                onClick={() => toggleSelect(m.id)}
                className="inline-flex items-center gap-1 rounded-full bg-[#FF4D15]/10 px-2.5 py-1 text-xs font-medium text-[#FF4D15] hover:bg-[#FF4D15]/20 transition-colors"
              >
                {m.name?.split(" ")[0] || m.email.split("@")[0]}
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}

        {/* Group name input — only when 2+ selected */}
        {isGroup && (
          <div className="px-5 py-2.5 border-b border-gray-100 dark:border-zinc-800">
            <input
              type="text"
              id="group-name"
              name="group-name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name (optional)"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 px-3 text-sm text-gray-900 placeholder-gray-400 focus:border-[#FF4D15] focus:outline-none focus:ring-1 focus:ring-[#FF4D15]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-400 transition-colors"
            />
          </div>
        )}

        {/* Members list */}
        <div className="max-h-[320px] overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : filteredMembers.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400 dark:text-zinc-500">
              {search ? "No team members found" : "No other team members"}
            </p>
          ) : (
            filteredMembers.map((member) => {
              const isSelected = selected.has(member.id);

              return (
                <button
                  key={member.id}
                  onClick={() => handleMemberClick(member)}
                  disabled={creating}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150",
                    isSelected
                      ? "bg-[#FF4D15]/5 dark:bg-[#FF4D15]/10"
                      : "hover:bg-gray-50 dark:hover:bg-zinc-800/50",
                    creating && "opacity-40 pointer-events-none"
                  )}
                >
                  {/* Selection indicator / Avatar */}
                  <div className="relative shrink-0">
                    {member.image ? (
                      <img
                        src={member.image}
                        alt={member.name || ""}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 dark:bg-zinc-700">
                        <span className="text-[10px] font-bold text-white">
                          {getInitials(member.name)}
                        </span>
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF4D15] ring-2 ring-white dark:ring-zinc-900">
                        <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {member.name || member.email}
                    </p>
                    <p className="truncate text-xs text-gray-400 dark:text-zinc-500">
                      {member.email}
                    </p>
                  </div>

                  {/* Role badge */}
                  <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {member.role}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Action button — Message (1 selected) or Create Group (2+ selected) */}
        {selected.size > 0 && (
          <div className="border-t border-gray-100 px-5 py-3 dark:border-zinc-800">
            {isGroup ? (
              <button
                onClick={handleCreateGroup}
                disabled={creating}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-white transition-all duration-200",
                  creating
                    ? "bg-gray-300 dark:bg-zinc-700"
                    : "bg-gradient-to-br from-[#FF0F0F] to-[#FFB21A] shadow-sm shadow-[#FF4D15]/20 hover:shadow-md hover:scale-[1.01]"
                )}
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Users className="h-4 w-4" />
                )}
                Create Group ({selected.size} people)
              </button>
            ) : (
              <button
                onClick={handleCreateDM}
                disabled={creating}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-white transition-all duration-200",
                  creating
                    ? "bg-gray-300 dark:bg-zinc-700"
                    : "bg-gradient-to-br from-[#FF0F0F] to-[#FFB21A] shadow-sm shadow-[#FF4D15]/20 hover:shadow-md hover:scale-[1.01]"
                )}
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageSquare className="h-4 w-4" />
                )}
                Message
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
