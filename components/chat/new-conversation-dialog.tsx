"use client";

import { useState, useEffect, useRef } from "react";
import { X, Search, Factory, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createConversation } from "@/lib/use-conversations";

type FactoryOption = { id: string; name: string; location: string | null };

interface NewConversationDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (conversationId: string) => void;
}

export function NewConversationDialog({
  open,
  onClose,
  onCreated,
}: NewConversationDialogProps) {
  const [factories, setFactories] = useState<FactoryOption[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setErrorMsg("");
    setCreating(null);
    setLoading(true);

    async function load() {
      try {
        const res = await fetch("/api/factories");
        if (res.ok) {
          const json = await res.json();
          setFactories(json.data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [open]);

  // Focus search input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const q = search.toLowerCase();
  const filtered = factories.filter(
    (f) =>
      f.name.toLowerCase().includes(q) ||
      f.location?.toLowerCase().includes(q)
  );

  async function handleSelect(factory: FactoryOption) {
    setCreating(factory.id);
    setErrorMsg("");
    try {
      const conv = await createConversation({
        subject: factory.name,
        factoryId: factory.id,
        type: "FACTORY",
      });
      onCreated(conv.id);
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Failed to create conversation"
      );
    } finally {
      setCreating(null);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            New Conversation
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300 dark:text-zinc-500" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search factories..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-[#EB5D2E] focus:outline-none focus:ring-1 focus:ring-[#EB5D2E]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-400"
            />
          </div>
        </div>

        {/* Factory list */}
        <div className="max-h-[320px] overflow-y-auto px-3 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400 dark:text-zinc-500" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400 dark:text-zinc-500">
              {search ? "No factories found" : "No factories yet"}
            </p>
          ) : (
            <div className="space-y-1">
              {filtered.map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleSelect(f)}
                  disabled={creating !== null}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors",
                    "hover:bg-gray-50 dark:hover:bg-zinc-800",
                    creating === f.id && "opacity-70"
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-700 to-gray-900 dark:from-zinc-600 dark:to-zinc-800">
                    <Factory className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                      {f.name}
                    </p>
                    {f.location && (
                      <p className="truncate text-xs text-gray-400 dark:text-zinc-500">
                        {f.location}
                      </p>
                    )}
                  </div>
                  {creating === f.id && (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#EB5D2E]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="border-t border-gray-100 dark:border-zinc-800 px-5 py-3">
            <p className="text-sm text-red-500">{errorMsg}</p>
          </div>
        )}
      </div>
    </div>
  );
}
