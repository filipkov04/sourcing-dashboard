"use client";

import { useState, useCallback, useEffect } from "react";
import { X, Search, Loader2, MessageSquare } from "lucide-react";
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
  const [creating, setCreating] = useState<string | null>(null);

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

  const handleSelect = useCallback(
    async (member: TeamMember) => {
      if (creating) return;
      setCreating(member.id);
      try {
        const conv = await createConversation({
          subject: member.name || member.email,
          participantIds: [member.id],
          type: "DIRECT",
        });
        onCreated(conv);
        onClose();
      } catch (err) {
        console.error("Failed to create DM:", err);
      } finally {
        setCreating(null);
      }
    },
    [creating, onCreated, onClose]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[#F97316]" />
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-[#FF8C1A] focus:outline-none focus:ring-1 focus:ring-[#FF8C1A]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-400 transition-colors"
              autoFocus
            />
          </div>
        </div>

        {/* Members list */}
        <div className="max-h-[400px] overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : filteredMembers.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400 dark:text-zinc-500">
              {search ? "No team members found" : "No other team members"}
            </p>
          ) : (
            filteredMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => handleSelect(member)}
                disabled={creating !== null}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150",
                  creating === member.id
                    ? "bg-[#F97316]/5"
                    : "hover:bg-gray-50 dark:hover:bg-zinc-800/50",
                  creating !== null && creating !== member.id && "opacity-40"
                )}
              >
                {/* Avatar */}
                {member.image ? (
                  <img
                    src={member.image}
                    alt={member.name || ""}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-900 dark:bg-zinc-700">
                    <span className="text-[10px] font-bold text-white">
                      {getInitials(member.name)}
                    </span>
                  </div>
                )}

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

                {creating === member.id && (
                  <Loader2 className="h-4 w-4 animate-spin text-[#F97316]" />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
