"use client";

import { useState, useEffect } from "react";
import { X, Search, Factory, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createConversation } from "@/lib/use-conversations";

type TeamMember = { id: string; name: string | null; email: string; role: string };
type FactoryOption = { id: string; name: string };

interface NewConversationDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (conversationId: string) => void;
}

export function NewConversationDialog({ open, onClose, onCreated }: NewConversationDialogProps) {
  const [tab, setTab] = useState<"person" | "factory">("person");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState<string | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [factories, setFactories] = useState<FactoryOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    async function load() {
      const [teamRes, factoriesRes] = await Promise.all([
        fetch("/api/team"),
        fetch("/api/factories"),
      ]);
      if (teamRes.ok) { const json = await teamRes.json(); setMembers(json.data); }
      if (factoriesRes.ok) { const json = await factoriesRes.json(); setFactories(json.data); }
      setLoading(false);
    }
    load();
  }, [open]);

  useEffect(() => {
    if (!open) { setSearch(""); setTab("person"); setCreating(null); }
  }, [open]);

  const q = search.toLowerCase();

  const filteredMembers = members.filter(
    (m) => m.name?.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
  );

  const filteredFactories = factories.filter(
    (f) => f.name.toLowerCase().includes(q)
  );

  async function handleSelectPerson(member: TeamMember) {
    setCreating(member.id);
    try {
      const conv = await createConversation({
        subject: member.name || member.email,
        participantIds: [member.id],
        type: "GENERAL",
      });
      onCreated(conv.id);
      onClose();
    } catch {
      setCreating(null);
    }
  }

  async function handleSelectFactory(factory: FactoryOption) {
    setCreating(factory.id);
    try {
      const conv = await createConversation({
        subject: factory.name,
        factoryId: factory.id,
        type: "FACTORY",
      });
      onCreated(conv.id);
      onClose();
    } catch {
      setCreating(null);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">New Message</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pb-3">
          {(["person", "factory"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setSearch(""); }}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                tab === t
                  ? "bg-gradient-to-b from-[#FFA53A] via-[#FF8C1A] to-[#F97316] text-white shadow-sm shadow-[#FF8C1A]/20"
                  : "text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
              )}
            >
              {t === "person" ? <User className="h-3 w-3" /> : <Factory className="h-3 w-3" />}
              {t === "person" ? "Person" : "Factory"}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-5 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300 dark:text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tab === "person" ? "Search people..." : "Search factories..."}
              autoFocus
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-[#FF8C1A] focus:outline-none focus:ring-1 focus:ring-[#FF8C1A]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-400 transition-colors"
            />
          </div>
        </div>

        {/* List */}
        <div className="max-h-64 overflow-y-auto border-t border-gray-100 dark:border-zinc-800">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-[#F97316]" />
            </div>
          ) : tab === "person" ? (
            filteredMembers.length === 0 ? (
              <p className="py-8 text-center text-xs text-gray-400 dark:text-zinc-500">No people found</p>
            ) : (
              filteredMembers.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleSelectPerson(m)}
                  disabled={creating !== null}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors disabled:opacity-50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-zinc-600 dark:to-zinc-700">
                    <span className="text-xs font-bold text-gray-600 dark:text-zinc-300">
                      {(m.name || m.email)[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {m.name || m.email}
                    </p>
                    {m.name && (
                      <p className="truncate text-xs text-gray-400 dark:text-zinc-500">{m.email}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                    {m.role}
                  </span>
                  {creating === m.id && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#F97316]" />}
                </button>
              ))
            )
          ) : (
            filteredFactories.length === 0 ? (
              <p className="py-8 text-center text-xs text-gray-400 dark:text-zinc-500">No factories found</p>
            ) : (
              filteredFactories.map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleSelectFactory(f)}
                  disabled={creating !== null}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors disabled:opacity-50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-700 to-gray-900 dark:from-zinc-600 dark:to-zinc-800">
                    <Factory className="h-4 w-4 text-white" />
                  </div>
                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900 dark:text-white">
                    {f.name}
                  </p>
                  {creating === f.id && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#F97316]" />}
                </button>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
}
