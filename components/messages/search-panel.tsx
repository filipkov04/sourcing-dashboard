"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { X, Search, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  searchConversationMessages,
  searchAllMessages,
  type Message,
} from "@/lib/use-conversations";

/* ─── In-Conversation Search Bar ─── */

interface ConversationSearchBarProps {
  conversationId: string;
  onNavigate: (messageId: string) => void;
  onClose: () => void;
}

export function ConversationSearchBar({
  conversationId,
  onNavigate,
  onClose,
}: ConversationSearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Message[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const doSearch = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setResults([]);
        setCurrentIndex(0);
        return;
      }
      setLoading(true);
      try {
        const msgs = await searchConversationMessages(conversationId, q);
        setResults(msgs);
        setCurrentIndex(0);
        if (msgs.length > 0) onNavigate(msgs[0].id);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [conversationId, onNavigate]
  );

  function handleChange(value: string) {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  }

  function navigate(direction: "up" | "down") {
    if (results.length === 0) return;
    const next =
      direction === "up"
        ? (currentIndex - 1 + results.length) % results.length
        : (currentIndex + 1) % results.length;
    setCurrentIndex(next);
    onNavigate(results[next].id);
  }

  return (
    <div className="flex items-center gap-2 border-b border-gray-100 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
      <Search className="h-4 w-4 shrink-0 text-gray-400 dark:text-zinc-500" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search in conversation..."
        className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none dark:text-white dark:placeholder-zinc-500"
        onKeyDown={(e) => {
          if (e.key === "Enter") navigate(e.shiftKey ? "up" : "down");
          if (e.key === "Escape") onClose();
        }}
      />
      {loading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
      {results.length > 0 && (
        <span className="shrink-0 text-xs tabular-nums text-gray-500 dark:text-zinc-400">
          {currentIndex + 1} of {results.length}
        </span>
      )}
      <button
        onClick={() => navigate("up")}
        disabled={results.length === 0}
        className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30 dark:text-zinc-500 dark:hover:bg-zinc-800"
      >
        <ChevronUp className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => navigate("down")}
        disabled={results.length === 0}
        className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100 disabled:opacity-30 dark:text-zinc-500 dark:hover:bg-zinc-800"
      >
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={onClose}
        className="flex h-6 w-6 items-center justify-center rounded text-gray-400 hover:bg-gray-100 dark:text-zinc-500 dark:hover:bg-zinc-800"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ─── Global Search Panel (sidebar mode) ─── */

interface GlobalSearchPanelProps {
  onSelectResult: (conversationId: string, messageId: string) => void;
  onClose: () => void;
}

type GlobalSearchResult = Message & {
  conversation: { id: string; subject: string | null; type: string };
};

function formatSearchTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday)
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function GlobalSearchPanel({ onSelectResult, onClose }: GlobalSearchPanelProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const msgs = await searchAllMessages(q);
      setResults(msgs as GlobalSearchResult[]);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(value: string) {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  }

  function highlightMatch(text: string, q: string) {
    if (!q || q.length < 2) return text;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-[#F97316]/20 text-[#F97316] rounded-sm px-0.5">
          {text.slice(idx, idx + q.length)}
        </mark>
        {text.slice(idx + q.length)}
      </>
    );
  }

  return (
    <div className="flex h-full w-[360px] flex-col border-l border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Search Messages</h3>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Search input */}
      <div className="px-3 py-2.5 border-b border-gray-100 dark:border-zinc-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-300 dark:text-zinc-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Search all messages..."
            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-[#FF8C1A] focus:outline-none focus:ring-1 focus:ring-[#FF8C1A]/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-400 transition-colors"
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
            }}
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400 dark:text-zinc-500" />
          </div>
        ) : results.length === 0 && searched ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <Search className="h-8 w-8 text-gray-200 dark:text-zinc-700 mb-3" />
            <p className="text-sm text-gray-500 dark:text-zinc-400">No messages found</p>
            <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500">Try a different search term</p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <Search className="h-8 w-8 text-gray-200 dark:text-zinc-700 mb-3" />
            <p className="text-sm text-gray-500 dark:text-zinc-400">Search across all conversations</p>
            <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500">Type at least 2 characters</p>
          </div>
        ) : (
          <div className="p-1.5 space-y-0.5">
            {results.map((result) => (
              <button
                key={result.id}
                onClick={() => onSelectResult(result.conversation.id, result.id)}
                className="flex w-full flex-col gap-1 rounded-xl px-3 py-2.5 text-left transition-all duration-150 hover:bg-gray-50 dark:hover:bg-zinc-800/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-medium text-gray-700 dark:text-zinc-300">
                    {result.conversation.subject || "Direct Message"}
                  </span>
                  <span className="shrink-0 text-[10px] tabular-nums text-gray-400 dark:text-zinc-500">
                    {formatSearchTime(result.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-2">
                  {result.sender?.name && (
                    <span className="font-medium text-gray-600 dark:text-zinc-300">
                      {result.sender.name}:{" "}
                    </span>
                  )}
                  {highlightMatch(result.content, query)}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
